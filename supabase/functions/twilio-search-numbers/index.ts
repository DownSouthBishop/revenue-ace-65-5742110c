// Search available Twilio numbers. Authenticated.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    // Use getUser() — getClaims() does not exist in Supabase JS v2
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { areaCode, contains, country = 'US' } = await req.json().catch(() => ({}));
    const sid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const tok = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const params = new URLSearchParams({ SmsEnabled: 'true', VoiceEnabled: 'true', PageSize: '20' });
    if (areaCode) params.set('AreaCode', String(areaCode).replace(/\D/g, '').slice(0, 3));
    if (contains) params.set('Contains', contains);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/AvailablePhoneNumbers/${country}/Local.json?${params}`;
    const r = await fetch(url, { headers: { Authorization: `Basic ${btoa(`${sid}:${tok}`)}` } });
    const data = await r.json();
    if (!r.ok) return json({ error: data }, r.status);
    const numbers = (data.available_phone_numbers || []).map((n: any) => ({
      number: n.phone_number,
      friendly: n.friendly_name,
      locality: n.locality || '',
      region: n.region || '',
    }));
    return json({ numbers });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
