// Sends the onboarding confirmation email via Resend.
// Fire-and-forget from the client; failures should not block onboarding.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Body {
  to?: string;
  businessName?: string;
  twilioNumber?: string;
  bookingLink?: string;
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { to, businessName, twilioNumber, bookingLink } = (await req.json()) as Body;

    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return new Response(JSON.stringify({ error: 'Invalid recipient email.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!businessName) {
      return new Response(JSON.stringify({ error: 'businessName required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const from = Deno.env.get('RESEND_FROM') || 'Respondfall <onboarding@resend.dev>';
    const dashboardUrl = Deno.env.get('APP_URL') || 'https://revenue-ace-65.lovable.app';

    const safeName = escape(businessName);
    const safeNumber = escape(twilioNumber || 'Pending provisioning');
    const safeBooking = bookingLink ? escape(bookingLink) : '';

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${safeName} is live on Respondfall</title></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0b1220;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8f0;">
        <tr><td style="padding:28px 32px 8px;">
          <div style="font-size:12px;letter-spacing:.18em;color:#1e7fd4;font-weight:700;text-transform:uppercase;">Respondfall · SkyforgeAI</div>
          <h1 style="margin:10px 0 6px;font-size:22px;line-height:1.25;">✅ ${safeName} is live on Respondfall</h1>
          <p style="margin:0 0 18px;color:#55607a;font-size:14px;line-height:1.55;">
            Your missed-call recovery system is active. Every missed call from now on will trigger an automatic SMS within seconds.
          </p>
        </td></tr>

        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e3e8f0;border-radius:10px;">
            <tr><td style="padding:16px 18px;">
              <div style="font-size:11px;letter-spacing:.1em;color:#7a869a;text-transform:uppercase;margin-bottom:6px;">Your Respondfall Number</div>
              <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:18px;font-weight:600;color:#0b1220;">${safeNumber}</div>
            </td></tr>
            ${safeBooking ? `<tr><td style="padding:0 18px 16px;">
              <div style="font-size:11px;letter-spacing:.1em;color:#7a869a;text-transform:uppercase;margin:6px 0;">Booking Link</div>
              <a href="${safeBooking}" style="color:#1e7fd4;text-decoration:none;word-break:break-all;font-size:14px;">${safeBooking}</a>
            </td></tr>` : ''}
          </table>
        </td></tr>

        <tr><td style="padding:22px 32px 8px;">
          <h2 style="font-size:15px;margin:0 0 8px;">What happens next</h2>
          <ul style="margin:0 0 16px;padding-left:18px;color:#55607a;font-size:14px;line-height:1.6;">
            <li>Set up conditional call forwarding to your Respondfall number (instructions in the Connect tab).</li>
            <li>Every missed call fires your SMS template within seconds — no app required.</li>
            <li>Check the Inbox tab for replies and the Analytics tab for revenue protected.</li>
          </ul>
        </td></tr>

        <tr><td align="center" style="padding:8px 32px 28px;">
          <a href="${escape(dashboardUrl)}" style="display:inline-block;background:#1e7fd4;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;font-size:14px;letter-spacing:.04em;">Open Dashboard</a>
        </td></tr>

        <tr><td style="padding:18px 32px;border-top:1px solid #eef1f7;color:#9aa4b8;font-size:12px;line-height:1.5;">
          You're receiving this because you just deployed ${safeName} on Respondfall. Reply to this email if you need help.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `✅ ${businessName} is live on Respondfall`,
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('resend error', res.status, data);
      return new Response(JSON.stringify({ error: data?.message || 'Resend send failed.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-onboard-email', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
