// Stripe Checkout session creator. Authenticated.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// Map tier → Stripe price id (set as secrets)
const PRICE_IDS: Record<string, string | undefined> = {
  starter: Deno.env.get('STRIPE_PRICE_STARTER'),
  growth:  Deno.env.get('STRIPE_PRICE_GROWTH'),
  agency:  Deno.env.get('STRIPE_PRICE_AGENCY'),
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const userSb = createClient(
      Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: { user }, error: authErr } = await userSb.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);
    const userId = user.id;
    const email = user.email as string | undefined;

    const { tier, returnUrl } = await req.json();
    if (!tier || !PRICE_IDS[tier]) return json({ error: 'Invalid tier' }, 400);

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return json({ error: 'Stripe not configured' }, 500);
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: sub } = await admin.from('subscriptions').select('stripe_customer_id').eq('user_id', userId).maybeSingle();
    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const cust = await stripe.customers.create({ email, metadata: { user_id: userId } });
      customerId = cust.id;
      await admin.from('subscriptions').upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: 'user_id' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PRICE_IDS[tier]!, quantity: 1 }],
      success_url: `${returnUrl || req.headers.get('origin') || 'https://respondfall.com'}?checkout=success`,
      cancel_url: `${returnUrl || req.headers.get('origin') || 'https://respondfall.com'}?checkout=cancelled`,
      metadata: { user_id: userId, tier },
      subscription_data: { metadata: { user_id: userId, tier } },
    });
    return json({ url: session.url });
  } catch (e) {
    console.error('checkout error', e);
    return json({ error: String(e) }, 500);
  }
});
