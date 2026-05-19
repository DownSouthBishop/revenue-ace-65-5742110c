# Respondfall — Missed Call Revenue Recovery

Respondfall automatically recovers missed calls for service businesses. When a call goes unanswered, the system fires an AI-generated SMS to the caller within seconds and follows up with a sequenced recovery flow.

**Stack:** React 18 + TypeScript + Vite · Supabase (Postgres, Auth, Edge Functions) · Twilio · Stripe · Resend

---

## How it works

1. The business forwards unanswered calls to their Respondfall number (a Twilio number provisioned on signup).
2. Twilio calls the `twilio-webhook` edge function, which records the missed call and sends an AI-generated recovery SMS.
3. Inbound replies route through `twilio-sms-webhook`, which generates context-aware AI responses.
4. A cron job (`sequence-runner`, every 5 min) processes scheduled follow-ups with TCPA blackout and opt-out enforcement.
5. A daily digest email (`send-daily-digest`, 8 AM UTC) summarises activity for each active client.

---

## Local development

### Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Supabase project
- Twilio account
- Stripe account (optional for billing)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in values
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# 3. Start the dev server
npm run dev
```

The app runs at `http://localhost:8080` by default.

### Running tests

```bash
npm test
```

### Building for production

```bash
npm run build
# Preview the production build locally:
npm run preview
```

---

## Environment variables

See `.env.example` for the full list with descriptions. The variables split into two groups:

| Prefix | Where set | Exposed to browser |
|--------|-----------|-------------------|
| `VITE_` | `.env` file | Yes (public) |
| (none) | Supabase → Edge Function Secrets | No (server only) |

**Never commit `.env`** — it is in `.gitignore`. Set production secrets in the Supabase dashboard under **Project Settings → Edge Functions → Secrets**.

---

## Supabase edge functions

All functions live in `supabase/functions/`. Deploy with:

```bash
supabase functions deploy --project-ref <your-project-ref>
```

### Function inventory

| Function | Trigger | Auth |
|----------|---------|------|
| `twilio-webhook` | Twilio voice (POST) | Twilio HMAC signature |
| `twilio-sms-webhook` | Twilio SMS (POST) | Twilio HMAC signature |
| `twilio-sms-status` | Twilio status callback | Twilio HMAC signature |
| `twilio-buy-number` | Browser (authenticated) | Supabase JWT |
| `twilio-release-number` | Browser (authenticated) | Supabase JWT |
| `twilio-search-numbers` | Browser (authenticated) | Supabase JWT |
| `validate-twilio-connection` | Browser (authenticated) | Supabase JWT |
| `send-manual-sms` | Browser (authenticated) | Supabase JWT |
| `send-onboard-email` | Browser (authenticated) | Supabase JWT |
| `stripe-checkout` | Browser (authenticated) | Supabase JWT |
| `stripe-portal` | Browser (authenticated) | Supabase JWT |
| `stripe-webhook` | Stripe (POST) | Stripe webhook signature |
| `sequence-runner` | Supabase cron (*/5 min) | `CRON_SECRET` header |
| `send-daily-digest` | Supabase cron (08:00 UTC) | `CRON_SECRET` header |

### Required secrets (set in Supabase dashboard)

```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STARTER
STRIPE_PRICE_GROWTH
STRIPE_PRICE_AGENCY
RESEND_API_KEY
RESEND_FROM
LOVABLE_API_KEY
APP_URL          # e.g. https://app.respondfall.com — used for CORS
CRON_SECRET      # random secret to protect cron endpoints from arbitrary triggers
```

---

## Deployment checklist

- [ ] Set all secrets in Supabase dashboard
- [ ] Deploy edge functions: `supabase functions deploy`
- [ ] Configure Twilio webhook URLs in the Connect tab after purchasing a number
- [ ] Configure Stripe webhook endpoint to point at `twilio-webhook` → actually `stripe-webhook` function URL
- [ ] Set `APP_URL` secret to match your production domain
- [ ] Rotate Supabase keys if they were ever committed to git history
- [ ] Run `npm run build` to verify a clean production build

---

## Architecture

```
Browser (React SPA)
  └─ Supabase Auth (JWT)
  └─ Supabase Realtime (live activity feed)
  └─ Edge Functions (authenticated API calls)

Twilio
  └─ Voice webhook → twilio-webhook (HMAC verified)
  └─ SMS webhook  → twilio-sms-webhook (HMAC verified)
  └─ Status CB    → twilio-sms-status (HMAC verified)

Stripe
  └─ Checkout/Portal → stripe-checkout / stripe-portal
  └─ Webhook        → stripe-webhook (signature verified)

Supabase Cron
  └─ */5 min → sequence-runner   (CRON_SECRET protected)
  └─ 08:00   → send-daily-digest (CRON_SECRET protected)
```

---

## Subscription tiers

| Tier | Monthly SMS | Clients | Phone numbers |
|------|-------------|---------|---------------|
| Free | 50 | 1 | 1 |
| Starter | 1,000 | 1 | 1 |
| Growth | 5,000 | 10 | 5 |
| Agency | 50,000 | unlimited | 50 |

Tier enforcement is applied in both the edge functions and the frontend (`src/lib/tiers.ts`).

---

## TCPA compliance

The system enforces:
- **Opt-out keywords:** STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT — immediately honoured and stored in `opt_outs`
- **Opt-in restoration:** START, UNSTOP
- **Blackout hours:** configurable per client (default 22:00–07:00 local time)
- **Daily SMS cap:** configurable per client (default 200/day)
- **Monthly quota:** enforced per subscription tier
