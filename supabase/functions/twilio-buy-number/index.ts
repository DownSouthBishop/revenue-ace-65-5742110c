// Buy a Twilio number and configure its webhooks. Authenticated.
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
    const userSb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await userSb.auth.getClaims(auth.replace('Bearer ', ''));
    if (!claims?.claims) return json({ error: 'Unauthorized' }, 401);
    const userId = claims.claims.sub as string;

    const { phoneNumber, clientId } = await req.json();
    if (!phoneNumber || !clientId) return json({ error: 'phoneNumber and clientId required' }, 400);

    // Verify ownership
    const { data: client } = await userSb.from('clients').select('id, owner_id').eq('id', clientId).maybeSingle();
    if (!client || client.owner_id !== userId) return json({ error: 'Forbidden' }, 403);

    const sid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const tok = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const projectRef = (Deno.env.get('SUPABASE_URL') || '').replace('https://', '').split('.')[0];
    const voiceUrl = `https://${projectRef}.supabase.co/functions/v1/twilio-webhook?client_id=${clientId}&stage=initial`;
    const smsUrl = `https://${projectRef}.supabase.co/functions/v1/twilio-sms-webhook?client_id=${clientId}`;

    const body = new URLSearchParams({
      PhoneNumber: phoneNumber,
      VoiceUrl: voiceUrl,
      VoiceMethod: 'POST',
      SmsUrl: smsUrl,
      SmsMethod: 'POST',
    });
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${sid}:${tok}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await r.json();
    if (!r.ok) return json({ error: data }, r.status);

    // Service role to update client (RLS-bypass for the trusted update)
    const adminSb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await adminSb.from('clients').update({
      respondfall_number: data.phone_number,
      twilio_number_sid: data.sid,
      twilio_sid: data.sid,
    }).eq('id', clientId);

    return json({ phoneNumber: data.phone_number, sid: data.sid });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
