// Twilio missed-call webhook handler.
// Twilio POSTs application/x-www-form-urlencoded with fields like From, To, CallStatus, CallSid.
// Query string: ?client_id=<uuid>
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWIML_OK = '<?xml version="1.0" encoding="UTF-8"?><Response/>';
const twimlResponse = () =>
  new Response(TWIML_OK, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
  });

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`{${k}}`, 'g'), v ?? ''),
    tpl,
  );
}

function inBlackout(start: number, end: number, d = new Date()) {
  const h = d.getUTCHours();
  // blackout wraps midnight when start > end (e.g. 22→7)
  if (start === end) return false;
  return start > end ? (h >= start || h < end) : (h >= start && h < end);
}

async function sendTwilioSms(opts: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${opts.accountSid}/Messages.json`;
  const auth = btoa(`${opts.accountSid}:${opts.authToken}`);
  const body = new URLSearchParams({ From: opts.from, To: opts.to, Body: opts.body });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio error ${res.status}: ${JSON.stringify(data)}`);
  return data as { sid: string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    if (!clientId) {
      return new Response('Missing client_id', { status: 400, headers: corsHeaders });
    }

    // Parse form-encoded body or JSON body (also supports inbound SMS testing)
    let params: Record<string, string> = {};
    const ct = req.headers.get('content-type') || '';
    if (req.method === 'POST') {
      if (ct.includes('application/json')) {
        const j = await req.json().catch(() => ({}));
        params = Object.fromEntries(Object.entries(j).map(([k, v]) => [k, String(v)]));
      } else {
        const text = await req.text();
        params = Object.fromEntries(new URLSearchParams(text));
      }
    }

    const from = params.From || params.from || '';
    const callStatus = (params.CallStatus || params.DialCallStatus || 'no-answer').toLowerCase();
    const inboundBody = params.Body || '';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Lookup client (service role bypasses RLS)
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();

    if (clientErr || !client) {
      console.error('client lookup failed', clientErr);
      return twimlResponse();
    }

    // Inbound SMS handling: STOP halts sequences for this number (TCPA)
    if (inboundBody && from) {
      const upper = inboundBody.trim().toUpperCase();
      await supabase.from('messages').insert({
        client_id: clientId,
        caller_number: from,
        direction: 'inbound',
        body: inboundBody,
        step_label: 'inbound',
      });
      if (upper === 'STOP' || upper === 'STOPALL' || upper === 'UNSUBSCRIBE' || upper === 'CANCEL' || upper === 'END' || upper === 'QUIT') {
        await supabase
          .from('conversations')
          .update({ status: 'stopped' })
          .eq('client_id', clientId)
          .eq('caller_number', from);
      }
      return twimlResponse();
    }

    // Missed-call handling
    if (!from) return twimlResponse();

    const isMissed =
      callStatus === 'no-answer' ||
      callStatus === 'busy' ||
      callStatus === 'failed' ||
      callStatus === 'canceled' ||
      callStatus === 'completed'; // some forwarding flows post completed-with-no-answer

    if (!isMissed) return twimlResponse();

    const { data: missedRow, error: missedErr } = await supabase
      .from('missed_calls')
      .insert({ client_id: clientId, caller_number: from, sequence_triggered: false })
      .select()
      .single();
    if (missedErr) console.error('missed_calls insert', missedErr);

    // Health ping
    await supabase
      .from('system_health')
      .upsert({ client_id: clientId, last_webhook_ping: new Date().toISOString() }, { onConflict: 'client_id' });

    // TCPA blackout check
    const inBlk = inBlackout(client.blackout_start ?? 22, client.blackout_end ?? 7);

    // Compose SMS
    const tpl = client.sms_template || 'Hey, sorry we missed you! Reply STOP to opt out.';
    const body = renderTemplate(tpl, {
      business_name: client.business_name ?? '',
      caller_number: from,
      time: new Date().toLocaleTimeString(),
      booking_link: client.booking_link ?? '',
    }).slice(0, 320);

    if (!client.system_active) return twimlResponse();
    if (inBlk) {
      console.log('Blackout window — skipping send for', clientId);
      return twimlResponse();
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = client.respondfall_number;

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Missing Twilio creds or respondfall_number');
      // still log a "pending" outbound so UI shows what would have been sent
      await supabase.from('messages').insert({
        client_id: clientId,
        caller_number: from,
        direction: 'outbound',
        body,
        step_label: 'missed_call_recovery_unsent',
      });
      return twimlResponse();
    }

    try {
      const delaySec = client.send_delay_seconds ?? 0;
      if (delaySec > 0) await new Promise((r) => setTimeout(r, Math.min(delaySec, 5) * 1000));

      const sent = await sendTwilioSms({
        accountSid,
        authToken,
        from: fromNumber,
        to: from,
        body,
      });

      await supabase.from('messages').insert({
        client_id: clientId,
        caller_number: from,
        direction: 'outbound',
        body,
        step_label: 'missed_call_recovery',
        twilio_sid: sent.sid,
      });
      if (missedRow?.id) {
        await supabase.from('missed_calls').update({ sequence_triggered: true }).eq('id', missedRow.id);
      }
      await supabase
        .from('system_health')
        .upsert(
          {
            client_id: clientId,
            last_successful_send: new Date().toISOString(),
            consecutive_failures: 0,
            last_error: null,
          },
          { onConflict: 'client_id' },
        );
    } catch (e) {
      console.error('Twilio send failed', e);
      await supabase.from('system_health').upsert(
        {
          client_id: clientId,
          last_error: String(e),
        },
        { onConflict: 'client_id' },
      );
    }

    return twimlResponse();
  } catch (err) {
    console.error('twilio-webhook error', err);
    return twimlResponse();
  }
});
