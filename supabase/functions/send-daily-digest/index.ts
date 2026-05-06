// Daily digest: per-client summary of yesterday's activity, emailed to owner via Resend.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const escape = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

function renderHtml(opts: {
  businessName: string;
  missed: number;
  smsSent: number;
  inbound: number;
  revenue: number;
  dashboardUrl: string;
}) {
  const { businessName, missed, smsSent, inbound, revenue, dashboardUrl } = opts;
  const safeName = escape(businessName);
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${safeName} — Yesterday on Respondfall</title></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0b1220;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8f0;">
        <tr><td style="padding:28px 32px 8px;">
          <div style="font-size:12px;letter-spacing:.18em;color:#1e7fd4;font-weight:700;text-transform:uppercase;">Respondfall · Daily Digest</div>
          <h1 style="margin:10px 0 6px;font-size:22px;line-height:1.25;">📊 ${safeName} — yesterday's recap</h1>
          <p style="margin:0 0 18px;color:#55607a;font-size:14px;line-height:1.55;">
            Here's what your missed-call recovery system did in the last 24 hours.
          </p>
        </td></tr>

        <tr><td style="padding:0 32px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px;">
            <tr>
              <td style="background:#f8fafc;border:1px solid #e3e8f0;border-radius:10px;padding:14px;width:33%;">
                <div style="font-size:11px;color:#7a869a;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Missed Calls</div>
                <div style="font-size:24px;font-weight:700;color:#0b1220;">${missed}</div>
              </td>
              <td style="background:#f8fafc;border:1px solid #e3e8f0;border-radius:10px;padding:14px;width:33%;">
                <div style="font-size:11px;color:#7a869a;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">SMS Sent</div>
                <div style="font-size:24px;font-weight:700;color:#0b1220;">${smsSent}</div>
              </td>
              <td style="background:#f8fafc;border:1px solid #e3e8f0;border-radius:10px;padding:14px;width:33%;">
                <div style="font-size:11px;color:#7a869a;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Replies</div>
                <div style="font-size:24px;font-weight:700;color:#0b1220;">${inbound}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:8px 32px 4px;">
          <div style="background:linear-gradient(135deg,#1e7fd4,#0b5ea8);border-radius:12px;padding:18px 20px;color:#ffffff;">
            <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.85;margin-bottom:4px;">Estimated Revenue Protected</div>
            <div style="font-size:28px;font-weight:800;">${fmtMoney(revenue)}</div>
            <div style="font-size:12px;opacity:.85;margin-top:4px;">Based on ${missed} missed call${missed === 1 ? '' : 's'} × your average job value.</div>
          </div>
        </td></tr>

        <tr><td align="center" style="padding:18px 32px 28px;">
          <a href="${escape(dashboardUrl)}" style="display:inline-block;background:#0b1220;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;font-size:14px;letter-spacing:.04em;">Open Dashboard</a>
        </td></tr>

        <tr><td style="padding:18px 32px;border-top:1px solid #eef1f7;color:#9aa4b8;font-size:12px;line-height:1.5;">
          You're getting this because ${safeName} is active on Respondfall. We only email when there's activity to report.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const from = Deno.env.get('RESEND_FROM') || 'Respondfall <onboarding@resend.dev>';
  const dashboardUrl = Deno.env.get('APP_URL') || 'https://revenue-ace-65.lovable.app';

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: clients, error: cErr } = await sb.from('clients').select('*');
  if (cErr) {
    console.error('clients query', cErr);
    return new Response(JSON.stringify({ error: cErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const summary = { totalClients: clients?.length ?? 0, sent: 0, skipped: 0, failed: 0 };

  for (const client of clients ?? []) {
    try {
      const [{ count: missed }, { count: smsSent }, { count: inbound }] = await Promise.all([
        sb.from('missed_calls').select('id', { count: 'exact', head: true })
          .eq('client_id', client.id).gte('called_at', since),
        sb.from('messages').select('id', { count: 'exact', head: true })
          .eq('client_id', client.id).eq('direction', 'outbound').gte('sent_at', since),
        sb.from('messages').select('id', { count: 'exact', head: true })
          .eq('client_id', client.id).eq('direction', 'inbound').gte('sent_at', since),
      ]);

      const missedN = missed ?? 0;
      const smsN = smsSent ?? 0;
      const inboundN = inbound ?? 0;

      if (missedN === 0 && smsN === 0 && inboundN === 0) {
        summary.skipped++;
        continue;
      }

      // Resolve owner email via auth admin API
      const { data: userRes, error: uErr } = await sb.auth.admin.getUserById(client.owner_id);
      const email = userRes?.user?.email;
      if (uErr || !email) {
        console.warn('no owner email', client.id, uErr?.message);
        summary.skipped++;
        continue;
      }

      const avg = Number(client.avg_job_value ?? 300);
      const revenue = missedN * avg;
      const businessName = client.business_name || 'Your business';

      const html = renderHtml({
        businessName, missed: missedN, smsSent: smsN, inbound: inboundN, revenue, dashboardUrl,
      });

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [email],
          subject: `📊 ${businessName}: ${missedN} missed call${missedN === 1 ? '' : 's'} captured yesterday`,
          html,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('resend send failed', res.status, data);
        summary.failed++;
      } else {
        summary.sent++;
      }
    } catch (e) {
      console.error('digest client error', client.id, e);
      summary.failed++;
    }
  }

  return new Response(JSON.stringify({ ok: true, ...summary }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
