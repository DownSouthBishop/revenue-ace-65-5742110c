// Validates that Twilio credentials in Supabase secrets are usable.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') ?? 'https://app.respondfall.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Require an authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const sbAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const tok = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!sid || !tok) {
      return new Response(JSON.stringify({ ok: false, error: 'Twilio credentials are not configured.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: `Basic ${btoa(`${sid}:${tok}`)}` },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = data?.message || `Twilio API ${r.status}`;
      return new Response(JSON.stringify({ ok: false, error: msg }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to surface a phone number from the account (best-effort)
    let phoneNumber = '';
    try {
      const np = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json?PageSize=1`, {
        headers: { Authorization: `Basic ${btoa(`${sid}:${tok}`)}` },
      });
      if (np.ok) {
        const j = await np.json();
        phoneNumber = j?.incoming_phone_numbers?.[0]?.phone_number || '';
      }
    } catch { /* ignore */ }

    return new Response(JSON.stringify({
      ok: true,
      accountSid: data?.sid,
      friendlyName: data?.friendly_name,
      status: data?.status,
      phoneNumber,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
