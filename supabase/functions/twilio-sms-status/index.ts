// Twilio SMS StatusCallback handler.
// Twilio POSTs form-encoded delivery receipts here; we update messages.status by twilio_sid.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED = new Set([
  'queued', 'sending', 'sent', 'receiving', 'received',
  'delivered', 'undelivered', 'failed',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    let sid = '';
    let status = '';
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const form = await req.formData();
      sid = String(form.get('MessageSid') || form.get('SmsSid') || '');
      status = String(form.get('MessageStatus') || form.get('SmsStatus') || '');
    } else {
      const j = await req.json().catch(() => ({}));
      sid = j.MessageSid || j.SmsSid || '';
      status = j.MessageStatus || j.SmsStatus || '';
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
