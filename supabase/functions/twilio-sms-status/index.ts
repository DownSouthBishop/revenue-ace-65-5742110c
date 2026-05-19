// Twilio SMS StatusCallback handler.
// Twilio POSTs form-encoded delivery receipts here; we update messages.status by twilio_sid.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') ?? 'https://app.respondfall.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED = new Set([
  'queued', 'sending', 'sent', 'receiving', 'received',
  'delivered', 'undelivered', 'failed',
]);

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    let sid = '';
    let status = '';
    let params: Record<string, string> = {};
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const form = await req.formData();
      form.forEach((v, k) => { params[k] = String(v); });
      sid = params['MessageSid'] || params['SmsSid'] || '';
      status = params['MessageStatus'] || params['SmsStatus'] || '';
    } else {
      const j = await req.json().catch(() => ({}));
      params = j;
      sid = j.MessageSid || j.SmsSid || '';
      status = j.MessageStatus || j.SmsStatus || '';
    }

    const twilioSig = req.headers.get('X-Twilio-Signature');
    if (!twilioSig || !(await validateTwilioSignature(req, params))) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    if (!sid || !ALLOWED.has(status)) {
      return new Response('ok', { headers: corsHeaders });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await sb.from('messages').update({ status }).eq('twilio_sid', sid);
    if (error) console.error('status update', error);

    return new Response('ok', { headers: corsHeaders });
  } catch (e) {
    console.error('twilio-sms-status', e);
    return new Response('ok', { headers: corsHeaders });
  }
});
