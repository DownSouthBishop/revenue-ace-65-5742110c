// Send a manual SMS from the dashboard. Authenticated.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') ?? 'https://app.respondfall.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const sbAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);
    const userId = user.id;

    const { clientId, to, body } = await req.json().catch(() => ({}));
    if (!clientId || !to || !body) return json({ error: 'Missing fields' }, 400);

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: client } = await sb.from('clients').select('*').eq('id', clientId).eq('owner_id', userId).maybeSingle();
    if (!client) return json({ error: 'Forbidden' }, 403);

    const sid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const tok = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${sid}:${tok}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        From: client.respondfall_number || '',
        To: to,
        Body: body,
        StatusCallback: `${supabaseUrl}/functions/v1/twilio-sms-status`,
      }),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: data?.message || 'Twilio error' }, 500);

    await sb.from('messages').insert({
      client_id: clientId, caller_number: to, direction: 'outbound',
      body, step_label: 'manual', twilio_sid: data.sid,
    });

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
