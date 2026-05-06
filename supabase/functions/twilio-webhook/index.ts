// Twilio Voice webhook: missed call handler.
// - Validates Twilio signature
// - Dedupes by CallSid
// - Honors opt_outs and conversation status
// - Blackout in client.timezone
// - Generates first SMS (uses GPT-4o via Lovable AI if available, else template)
// - Schedules step-2 follow-up
// - Captures recording_url + transcript when present

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};
const TWIML_OK = '<?xml version="1.0" encoding="UTF-8"?><Response/>';
const tw = () => new Response(TWIML_OK, { status: 200, headers: { ...cors, 'Content-Type': 'text/xml' } });

function tplVars(tpl: string, v: Record<string, string>) {
  return Object.entries(v).reduce((a, [k, val]) => a.replace(new RegExp(`{${k}}`, 'g'), val ?? ''), tpl);
}

function hourInTZ(tz: string, d = new Date()) {
  try {
    const s = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(d);
    return parseInt(s, 10);
  } catch { return d.getUTCHours(); }
}
function inBlackout(start: number, end: number, h: number) {
  if (start === end) return false;
  return start > end ? (h >= start || h < end) : (h >= start && h < end);
}

async function validateTwilioSignature(req: Request, rawBody: string, params: Record<string, string>) {
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const sig = req.headers.get('X-Twilio-Signature');
  if (!token || !sig) return false;
  const url = req.url;
  const sortedKeys = Object.keys(params).sort();
  const data = url + sortedKeys.map((k) => k + params[k]).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(token), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  return expected === sig;
}

async function aiReply(client: any, from: string): Promise<string | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return null;
  try {
    const sysPrompt = `You write a single SMS for a ${client.industry} business named "${client.business_name}" responding to a missed call from ${from}. Be warm, professional, urgent. Include the booking link if provided. Under 160 chars. Always end with "Reply STOP to opt out."`;
    const userPrompt = `Booking link: ${client.booking_link || 'n/a'}.`;
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const text = j?.choices?.[0]?.message?.content?.trim();
    return text ? text.slice(0, 320) : null;
  } catch { return null; }
}

async function sendSms(from: string, to: string, body: string) {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
  const tok = Deno.env.get('TWILIO_AUTH_TOKEN')!;
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${sid}:${tok}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Twilio ${r.status}: ${JSON.stringify(data)}`);
  return data as { sid: string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    if (!clientId) return new Response('Missing client_id', { status: 400, headers: cors });

    let params: Record<string, string> = {};
    let rawBody = '';
    if (req.method === 'POST') {
      rawBody = await req.text();
      params = Object.fromEntries(new URLSearchParams(rawBody));
    }

    // Signature validation (skip if no signature header — allows simulate-call)
    const hasSig = req.headers.get('X-Twilio-Signature');
    if (hasSig) {
      const ok = await validateTwilioSignature(req, rawBody, params);
      if (!ok) {
        console.warn('Invalid Twilio signature for', clientId);
        return new Response('Forbidden', { status: 403, headers: cors });
      }
    }

    const from = params.From || '';
    const callStatus = (params.CallStatus || params.DialCallStatus || 'no-answer').toLowerCase();
    const callSid = params.CallSid || null;
    const recordingUrl = params.RecordingUrl || null;
    const transcript = params.TranscriptionText || null;

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: client } = await sb.from('clients').select('*').eq('id', clientId).maybeSingle();
    if (!client) return tw();

    // Recording / transcription update path
    if (callSid && (recordingUrl || transcript)) {
      await sb.from('missed_calls')
        .update({ recording_url: recordingUrl, transcript, voicemail_url: recordingUrl })
        .eq('call_sid', callSid);
      return tw();
    }

    if (!from) return tw();

    const isMissed = ['no-answer', 'busy', 'failed', 'canceled', 'completed'].includes(callStatus);
    if (!isMissed) return tw();

    // Dedupe missed call by CallSid
    if (callSid) {
      const { data: existing } = await sb.from('missed_calls').select('id').eq('call_sid', callSid).maybeSingle();
      if (existing) return tw();
    }

    const { data: missedRow } = await sb.from('missed_calls')
      .insert({ client_id: clientId, caller_number: from, sequence_triggered: false, call_sid: callSid })
      .select().single();

    await sb.from('system_health').upsert({ client_id: clientId, last_webhook_ping: new Date().toISOString() }, { onConflict: 'client_id' });

    // Opt-out check
    const { data: opt } = await sb.from('opt_outs').select('id').eq('client_id', clientId).eq('caller_number', from).maybeSingle();
    if (opt) return tw();

    if (!client.system_active) return tw();

    // Blackout in client TZ
    const h = hourInTZ(client.timezone || 'America/New_York');
    if (inBlackout(client.blackout_start ?? 22, client.blackout_end ?? 7, h)) return tw();

    // Build SMS — try AI first, fall back to template
    let body = await aiReply(client, from);
    if (!body) {
      body = tplVars(client.sms_template || 'Hey, sorry we missed you! Reply STOP.', {
        business_name: client.business_name ?? '',
        caller_number: from,
        time: new Date().toLocaleTimeString(),
        booking_link: client.booking_link ?? '',
      }).slice(0, 320);
    }

    const fromNumber = client.respondfall_number;
    if (!fromNumber) return tw();

    try {
      const sent = await sendSms(fromNumber, from, body);
      await sb.from('messages').insert({
        client_id: clientId, caller_number: from, direction: 'outbound',
        body, step_label: 'missed_call_recovery', twilio_sid: sent.sid, ai_generated: true,
      });
      if (missedRow?.id) await sb.from('missed_calls').update({ sequence_triggered: true }).eq('id', missedRow.id);
      await sb.from('system_health').upsert({
        client_id: clientId, last_successful_send: new Date().toISOString(),
        consecutive_failures: 0, last_error: null,
      }, { onConflict: 'client_id' });

      // Schedule step-2 in 4 hours
      const sendAt = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
      const followUp = tplVars('Hey, still hoping to connect — {business_name} has openings. Book: {booking_link}. Reply STOP.', {
        business_name: client.business_name ?? '', booking_link: client.booking_link ?? '',
      }).slice(0, 320);
      await sb.from('scheduled_messages').insert({
        client_id: clientId, caller_number: from, body: followUp, step_label: 'follow_up_2', send_at: sendAt,
      });
    } catch (e) {
      console.error('send fail', e);
      await sb.from('system_health').upsert({ client_id: clientId, last_error: String(e) }, { onConflict: 'client_id' });
    }

    return tw();
  } catch (err) {
    console.error('twilio-webhook error', err);
    return tw();
  }
});
