// Twilio Voice webhook — forwards call to business, captures missed/voicemail.
// Flow:
//   1) Initial POST → returns TwiML <Dial> to business_number with action=this_url&CallStatus=*
//   2) Twilio callback after Dial → if no-answer/busy/failed, returns <Record transcribe="true">
//   3) Recording callback → updates missed_calls with recording_url + transcript, kicks off SMS
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};
const xml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, { status: 200, headers: { ...cors, 'Content-Type': 'text/xml' } });
const ok = () => xml('<Response/>');

function tplVars(t: string, v: Record<string, string>) {
  return Object.entries(v).reduce((a, [k, val]) => a.replace(new RegExp(`{${k}}`, 'g'), val ?? ''), t);
}
function hourInTZ(tz: string, d = new Date()) {
  try { return parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(d), 10); }
  catch { return d.getUTCHours(); }
}
function inBlackout(start: number, end: number, h: number) {
  if (start === end) return false;
  return start > end ? (h >= start || h < end) : (h >= start && h < end);
}
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

async function aiReply(client: any, from: string, transcript: string | null) {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return null;
  try {
    const sys = `Write ONE SMS for "${client.business_name}" (${client.industry}) to a missed caller. Warm, professional, urgent. Under 160 chars. End with "Reply STOP to opt out."`;
    const user = `Caller: ${from}. Voicemail: ${transcript || '(none)'}. Booking: ${client.booking_link || 'n/a'}.`;
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] }),
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
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${sid}:${tok}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      From: from, To: to, Body: body,
      StatusCallback: `${supabaseUrl}/functions/v1/twilio-sms-status`,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Twilio ${r.status}: ${JSON.stringify(data)}`);
  return data as { sid: string };
}

async function dailyCount(sb: any, clientId: string) {
  const since = new Date(); since.setHours(0, 0, 0, 0);
  const { count } = await sb.from('messages').select('id', { count: 'exact', head: true })
    .eq('client_id', clientId).eq('direction', 'outbound').gte('sent_at', since.toISOString());
  return count ?? 0;
}

async function processMissed(sb: any, client: any, from: string, callSid: string | null, transcript: string | null, recordingUrl: string | null) {
  // Dedupe + insert / update
  let row: any = null;
  if (callSid) {
    const { data: existing } = await sb.from('missed_calls').select('*').eq('call_sid', callSid).maybeSingle();
    row = existing;
  }
  if (!row) {
    const { data } = await sb.from('missed_calls').insert({
      client_id: client.id, caller_number: from, sequence_triggered: false,
      call_sid: callSid, recording_url: recordingUrl, voicemail_url: recordingUrl, transcript,
    }).select().single();
    row = data;
  } else if (recordingUrl || transcript) {
    await sb.from('missed_calls').update({ recording_url: recordingUrl, voicemail_url: recordingUrl, transcript }).eq('id', row.id);
    if (row.sequence_triggered) return;
  }
  await sb.from('system_health').upsert({ client_id: client.id, last_webhook_ping: new Date().toISOString() }, { onConflict: 'client_id' });

  if (!client.system_active) return;

  // Opt-out + blackout + cap
  const { data: opt } = await sb.from('opt_outs').select('id').eq('client_id', client.id).eq('caller_number', from).maybeSingle();
  if (opt) return;
  const h = hourInTZ(client.timezone || 'America/New_York');
  if (inBlackout(client.blackout_start ?? 22, client.blackout_end ?? 7, h)) return;
  const cap = client.daily_sms_cap ?? 200;
  if ((await dailyCount(sb, client.id)) >= cap) {
    await sb.from('system_health').upsert({ client_id: client.id, last_error: `Daily SMS cap (${cap}) reached` }, { onConflict: 'client_id' });
    return;
  }

  let body = await aiReply(client, from, transcript);
  if (!body) {
    body = tplVars(client.sms_template || 'Hey, sorry we missed you! Reply STOP.', {
      business_name: client.business_name ?? '', caller_number: from,
      time: new Date().toLocaleTimeString(), booking_link: client.booking_link ?? '',
    }).slice(0, 320);
  }
  if (!client.respondfall_number) return;
  try {
    const sent = await sendSms(client.respondfall_number, from, body);
    await sb.from('messages').insert({
      client_id: client.id, caller_number: from, direction: 'outbound',
      body, step_label: 'missed_call_recovery', twilio_sid: sent.sid, ai_generated: true,
    });
    if (row?.id) await sb.from('missed_calls').update({ sequence_triggered: true }).eq('id', row.id);
    await sb.from('system_health').upsert({
      client_id: client.id, last_successful_send: new Date().toISOString(),
      consecutive_failures: 0, last_error: null,
    }, { onConflict: 'client_id' });
    // Schedule step-2 follow-up in 4 hours
    const sendAt = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
    const followUp = tplVars('Hey, still hoping to connect — {business_name} has openings. Book: {booking_link}. Reply STOP.', {
      business_name: client.business_name ?? '', booking_link: client.booking_link ?? '',
    }).slice(0, 320);
    await sb.from('scheduled_messages').insert({
      client_id: client.id, caller_number: from, body: followUp, step_label: 'follow_up_2', send_at: sendAt,
    });
  } catch (e) {
    console.error('send fail', e);
    await sb.from('system_health').upsert({ client_id: client.id, last_error: String(e) }, { onConflict: 'client_id' });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    const stage = url.searchParams.get('stage') || 'initial'; // initial | dial_status | recording
    if (!clientId) return new Response('Missing client_id', { status: 400, headers: cors });

    let params: Record<string, string> = {};
    if (req.method === 'POST') {
      const raw = await req.text();
      params = Object.fromEntries(new URLSearchParams(raw));
    }
    const hasSig = req.headers.get('X-Twilio-Signature');
    if (hasSig) {
      if (!(await validateTwilioSignature(req, params))) {
        console.warn('Invalid Twilio sig for', clientId);
        return new Response('Forbidden', { status: 403, headers: cors });
      }
    }
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: client } = await sb.from('clients').select('*').eq('id', clientId).maybeSingle();
    if (!client) return ok();

    const projectRef = (Deno.env.get('SUPABASE_URL') || '').replace('https://', '').split('.')[0];
    const baseUrl = `https://${projectRef}.supabase.co/functions/v1/twilio-webhook`;
    const from = params.From || '';
    const callSid = params.CallSid || null;

    // STAGE 1: initial → dial business, then call back here with stage=dial_status
    if (stage === 'initial') {
      const businessNum = client.business_number;
      if (!businessNum) {
        // No forwarding configured → straight to voicemail
        const recUrl = `${baseUrl}?client_id=${clientId}&stage=recording`;
        return xml(`<Response><Say voice="alice">Sorry we missed you. Please leave a brief message after the tone and we'll text you right back.</Say><Record action="${recUrl}" method="POST" maxLength="60" transcribe="true" transcribeCallback="${recUrl}" playBeep="true" /></Response>`);
      }
      const dialAction = `${baseUrl}?client_id=${clientId}&stage=dial_status`;
      const timeout = client.forward_timeout_seconds ?? 18;
      return xml(`<Response><Dial timeout="${timeout}" action="${dialAction}" method="POST"><Number>${businessNum}</Number></Dial></Response>`);
    }

    // STAGE 2: dial finished → if not answered, take voicemail
    if (stage === 'dial_status') {
      const status = (params.DialCallStatus || '').toLowerCase();
      if (status === 'completed' || status === 'answered') return ok();
      const recUrl = `${baseUrl}?client_id=${clientId}&stage=recording`;
      // Pre-create missed_calls row so recording callback can match by call_sid
      if (callSid && from) {
        await sb.from('missed_calls').upsert(
          { client_id: clientId, caller_number: from, call_sid: callSid, sequence_triggered: false },
          { onConflict: 'call_sid' }
        );
      }
      return xml(`<Response><Say voice="alice">Sorry we missed you. Please leave a brief message after the tone and we'll text you right back.</Say><Record action="${recUrl}" method="POST" maxLength="60" transcribe="true" transcribeCallback="${recUrl}" playBeep="true" /></Response>`);
    }

    // STAGE 3: recording / transcription callback
    if (stage === 'recording') {
      const recordingUrl = params.RecordingUrl || null;
      const transcript = params.TranscriptionText || null;
      if (from || callSid) {
        await processMissed(sb, client, from || (await sb.from('missed_calls').select('caller_number').eq('call_sid', callSid).maybeSingle()).data?.caller_number || '', callSid, transcript, recordingUrl);
      }
      return ok();
    }

    return ok();
  } catch (err) {
    console.error('twilio-webhook error', err);
    return ok();
  }
});
