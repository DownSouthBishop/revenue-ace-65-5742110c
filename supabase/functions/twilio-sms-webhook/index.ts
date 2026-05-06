// Twilio Messaging webhook: inbound SMS handler.
// - Logs inbound message
// - Honors STOP/UNSUBSCRIBE → adds to opt_outs and cancels pending scheduled
// - Generates AI reply via Lovable AI

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};
const TWIML = (xml = '<Response/>') =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>${xml}`, { status: 200, headers: { ...cors, 'Content-Type': 'text/xml' } });

const STOP_WORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);

async function validateTwilioSignature(req: Request, params: Record<string, string>) {
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const sig = req.headers.get('X-Twilio-Signature');
  if (!token || !sig) return false;
  const sortedKeys = Object.keys(params).sort();
  const data = req.url + sortedKeys.map((k) => k + params[k]).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(token), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  return expected === sig;
}

async function aiReply(client: any, from: string, history: { role: string; content: string }[]) {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return null;
  const sys = `You are an SMS assistant for "${client.business_name}" (${client.industry}). Be warm, professional, concise. If the customer wants to book, share: ${client.booking_link || '(no booking link configured)'}. Always under 160 chars. Never include "Reply STOP".`;
  try {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [{ role: 'system', content: sys }, ...history] }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.choices?.[0]?.message?.content?.trim()?.slice(0, 320) ?? null;
  } catch { return null; }
}

async function sendSms(from: string, to: string, body: string) {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
  const tok = Deno.env.get('TWILIO_AUTH_TOKEN')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const params: Record<string, string> = {
    From: from, To: to, Body: body,
    StatusCallback: `${supabaseUrl}/functions/v1/twilio-sms-status`,
  };
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${sid}:${tok}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  return r.ok ? await r.json() : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    if (!clientId) return new Response('Missing client_id', { status: 400, headers: cors });

    const raw = req.method === 'POST' ? await req.text() : '';
    const params = Object.fromEntries(new URLSearchParams(raw));
    const twilioSig = req.headers.get('X-Twilio-Signature');
    if (!twilioSig) return new Response('Forbidden', { status: 403, headers: cors });
    if (!(await validateTwilioSignature(req, params))) return new Response('Forbidden', { status: 403, headers: cors });
    const from = params.From || '';
    const body = params.Body || '';
    if (!from || !body) return TWIML();

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: client } = await sb.from('clients').select('*').eq('id', clientId).maybeSingle();
    if (!client) return TWIML();

    // Log inbound
    await sb.from('messages').insert({
      client_id: clientId, caller_number: from, direction: 'inbound',
      body, step_label: 'inbound', twilio_sid: params.MessageSid || null,
    });

    const upper = body.trim().toUpperCase();
    if (STOP_WORDS.has(upper)) {
      await sb.from('opt_outs').upsert({ client_id: clientId, caller_number: from }, { onConflict: 'client_id,caller_number' });
      await sb.from('scheduled_messages').update({ status: 'cancelled' })
        .eq('client_id', clientId).eq('caller_number', from).eq('status', 'pending');
      return TWIML('<Response><Message>You have been unsubscribed and will receive no more messages.</Message></Response>');
    }
    if (upper === 'START' || upper === 'UNSTOP') {
      await sb.from('opt_outs').delete().eq('client_id', clientId).eq('caller_number', from);
      return TWIML('<Response><Message>You are re-subscribed. Reply STOP to opt out.</Message></Response>');
    }

    // Cancel any pending follow-ups for this caller (they replied)
    await sb.from('scheduled_messages').update({ status: 'cancelled' })
      .eq('client_id', clientId).eq('caller_number', from).eq('status', 'pending');

    // Daily cap guard
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const { count: dayCount } = await sb.from('messages').select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('direction', 'outbound').gte('sent_at', since.toISOString());
    if ((dayCount ?? 0) >= (client.daily_sms_cap ?? 200)) return TWIML();

    // Generate AI reply
    const { data: hist } = await sb.from('messages').select('direction, body')
      .eq('client_id', clientId).eq('caller_number', from)
      .order('sent_at', { ascending: true }).limit(20);
    const history = (hist || []).map((m: any) => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.body,
    }));
    const reply = await aiReply(client, from, history);
    if (reply && client.respondfall_number) {
      const sent = await sendSms(client.respondfall_number, from, reply);
      await sb.from('messages').insert({
        client_id: clientId, caller_number: from, direction: 'outbound',
        body: reply, step_label: 'ai_reply', twilio_sid: sent?.sid || null, ai_generated: true,
      });
    }
    return TWIML();
  } catch (e) {
    console.error('twilio-sms-webhook error', e);
    return TWIML();
  }
});
