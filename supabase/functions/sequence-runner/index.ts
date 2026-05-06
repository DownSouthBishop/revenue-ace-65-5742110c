// Cron-triggered: process due scheduled_messages with TCPA/blackout/opt-out/cap guards.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*' };

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
  const nowIso = new Date().toISOString();
  const { data: due } = await sb.from('scheduled_messages').select('*').eq('status', 'pending').lte('send_at', nowIso).limit(50);
  const items = due ?? [];
  let sent = 0, skipped = 0, failed = 0;
  for (const m of items) {
    try {
      const { data: client } = await sb.from('clients').select('*').eq('id', m.client_id).maybeSingle();
      if (!client || !client.system_active || !client.respondfall_number) { skipped++; await sb.from('scheduled_messages').update({ status: 'cancelled', last_error: 'client inactive/missing' }).eq('id', m.id); continue; }
      const { data: opt } = await sb.from('opt_outs').select('id').eq('client_id', client.id).eq('caller_number', m.caller_number).maybeSingle();
      if (opt) { skipped++; await sb.from('scheduled_messages').update({ status: 'cancelled', last_error: 'opted out' }).eq('id', m.id); continue; }
      const h = hourInTZ(client.timezone || 'America/New_York');
      if (inBlackout(client.blackout_start ?? 22, client.blackout_end ?? 7, h)) { skipped++; continue; }
      const since = new Date(); since.setHours(0,0,0,0);
      const { count } = await sb.from('messages').select('id', { count: 'exact', head: true }).eq('client_id', client.id).eq('direction', 'outbound').gte('sent_at', since.toISOString());
      if ((count ?? 0) >= (client.daily_sms_cap ?? 200)) { skipped++; continue; }
      const r = await sendSms(client.respondfall_number, m.caller_number, m.body);
      await sb.from('messages').insert({ client_id: client.id, caller_number: m.caller_number, direction: 'outbound', body: m.body, step_label: m.step_label, twilio_sid: r.sid, ai_generated: false });
      await sb.from('scheduled_messages').update({ status: 'sent' }).eq('id', m.id);
      await sb.from('system_health').upsert({ client_id: client.id, last_successful_send: new Date().toISOString(), consecutive_failures: 0, last_error: null }, { onConflict: 'client_id' });
      sent++;
    } catch (e) {
      failed++;
      const attempts = (m.attempts ?? 0) + 1;
      await sb.from('scheduled_messages').update({ attempts, status: attempts >= 3 ? 'failed' : 'pending', last_error: String(e) }).eq('id', m.id);
    }
  }
  return new Response(JSON.stringify({ processed: items.length, sent, skipped, failed }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
