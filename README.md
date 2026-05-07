# Respondfall

AI missed-call recovery for service businesses. When a customer calls and hangs up, Respondfall texts them back within seconds — recovering leads and booking jobs automatically while you work.

## Features

- **Instant SMS recovery** — automated text sequences fire within seconds of every missed call
- **Inbox** — two-way SMS conversation threads with customers
- **Sequences** — configurable multi-step follow-up automation
- **Analytics** — revenue recovery tracking, call/message trends
- **Referrals** — built-in referral request system
- **Billing** — Stripe-powered subscription management
- **Multi-client** — manage multiple business locations from one account
- **Web Push** — real-time browser notifications for new activity

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, TypeScript 5 |
| UI | Shadcn/ui, Radix UI, Tailwind CSS |
| State | Zustand, TanStack Query |
| Backend | Supabase (Postgres, Auth, Edge Functions) |
| Telephony | Twilio (calls + SMS) |
| Payments | Stripe |
| Testing | Vitest, Playwright |

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- A [Supabase](https://supabase.com) project
- A [Twilio](https://twilio.com) account (for telephony)
- A [Stripe](https://stripe.com) account (for billing)

### 1. Install dependencies

```bash
npm install
# or
bun install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

To generate a VAPID key pair for Web Push:

```bash
npx web-push generate-vapid-keys
```

### 3. Set up Supabase

Apply all database migrations:

```bash
npx supabase db push
# or via the Supabase CLI
supabase db push --db-url your_db_url
```

Deploy edge functions:

```bash
supabase functions deploy
```

Set required edge function secrets in your Supabase dashboard:

```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY
VAPID_PRIVATE_KEY
VAPID_PUBLIC_KEY
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build (with source maps) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
├── components/
│   ├── dashboard/       # Tab content components (Activity, Inbox, Analytics, etc.)
│   ├── onboard/         # Onboarding step components
│   └── ui/              # Shadcn/ui base components
├── integrations/
│   └── supabase/        # Supabase client + auto-generated DB types
├── pages/               # Top-level pages (Auth, Dashboard, Onboard, Legal, 404)
├── store/               # Zustand store (appStore.ts) — all client state
├── test/                # Unit tests
└── types/               # Domain type definitions (respondfall.ts)

supabase/
├── functions/           # Edge functions (Twilio webhooks, Stripe, SMS send, etc.)
└── migrations/          # Numbered SQL migrations
```

## Architecture

### Auth Flow

1. `Index.tsx` subscribes to `supabase.auth.onAuthStateChange`
2. No session → `AuthPage` (sign in / sign up / magic link)
3. Session + no clients → `OnboardPage` (4-step setup wizard)
4. Session + clients → `DashboardPage`

### Data Flow

- All application state lives in `useAppStore` (Zustand + localStorage persistence)
- Supabase Realtime subscriptions keep call logs and messages in sync
- Edge functions handle all Twilio webhooks and outbound SMS

### Telephony

- Twilio forwards missed calls to the Respondfall webhook
- `incoming-call` edge function logs the call and triggers the SMS sequence
- `send-sequence` edge function fires scheduled follow-up messages
- All Twilio credentials are stored per-client in the `clients` table

## Deployment

The app is a standard Vite SPA — deploy to any static host:

**Vercel / Netlify:**
```bash
npm run build
# Upload the dist/ directory
```

Set all `VITE_*` environment variables in your hosting platform's dashboard.

**Supabase edge functions** deploy separately via the Supabase CLI or dashboard.

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_VAPID_PUBLIC_KEY` | For push | VAPID public key for Web Push notifications |

## Running Tests

```bash
# Unit tests
npm test

# Unit tests in watch mode
npm run test:watch

# E2E tests (requires dev server running)
npx playwright test
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm test` — both must pass
4. Open a pull request

## License

MIT © SkyforgeAI
