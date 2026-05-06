// Sequence runner — invoked by pg_cron every minute. Sends due scheduled messages.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

function hourInTZ(tz: string, d = new Date()) {
  try { return parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(d), 10); }
  catch { return d.getUTCHours(); }
}
function inBlackout(s: number, e: number, h: number) {
  if (s === e) return false;
  return s > e ? (h >= s || h < e) : (h >= s && h < e);
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
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: due, error } = await sb.from('scheduled_messages')
    .select('*').eq('status', 'pending').lte('send_at', new Date().toISOString()).limit(50);
  if (error) return json({ error: error.message }, 500);

  let sent = 0, skipped = 0, failed = 0;
  for (const m of due ?? []) {
    const { data: client } = await sb.from('clients').select('*').eq('id', m.client_id).maybeSingle();
    if (!client?.system_active || !client?.respondfall_number) {
      await sb.from('scheduled_messages').update({ status: 'cancelled', last_error: 'inactive_or_no_number' }).eq('id', m.id);
      skipped++; continue;
    }
    const { data: opt } = await sb.from('opt_outs').select('id').eq('client_id', m.client_id).eq('caller_number', m.caller_number).maybeSingle();
    if (opt) {
      await sb.from('scheduled_messages').update({ status: 'cancelled', last_error: 'opted_out' }).eq('id', m.id);
      skipped++; continue;
    }
    const h = hourInTZ(client.timezone || 'America/New_York');
    if (inBlackout(client.blackout_start ?? 22, client.blackout_end ?? 7, h)) {
      // Defer 1 hour
      await sb.from('scheduled_messages').update({ send_at: new Date(Date.now() + 3600 * 1000).toISOString() }).eq('id', m.id);
      skipped++; continue;
    }
    try {
      const out = await sendSms(client.respondfall_number, m.caller_number, m.body);
      await sb.from('messages').insert({
        client_id: m.client_id, caller_number: m.caller_number, direction: 'outbound',
        body: m.body, step_label: m.step_label, twilio_sid: out.sid,
      });
      await sb.from('scheduled_messages').update({ status: 'sent' }).eq('id', m.id);
      sent++;
    } catch (e) {
      const attempts = (m.attempts ?? 0) + 1;
      const status = attempts >= 3 ? 'failed' : 'pending';
      await sb.from('scheduled_messages').update({
        status, attempts, last_error: String(e),
        send_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      }).eq('id', m.id);
      failed++;
    }
  }
  return json({ sent, skipped, failed });
});
