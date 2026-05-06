// Stripe webhook handler — idempotent via webhook_events table.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

function tierFromPrice(priceId: string): string | null {
  if (priceId === Deno.env.get('STRIPE_PRICE_STARTER')) return 'starter';
  if (priceId === Deno.env.get('STRIPE_PRICE_GROWTH')) return 'growth';
  if (priceId === Deno.env.get('STRIPE_PRICE_AGENCY')) return 'agency';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const sig = req.headers.get('stripe-signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!sig || !secret || !stripeKey) return new Response('Misconfigured', { status: 500, headers: cors });

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret);
  } catch (e) {
    console.error('Bad signature', e);
    return new Response('Invalid signature', { status: 400, headers: cors });
  }

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Idempotency
  const { error: dupeErr } = await sb.from('webhook_events').insert({
    provider: 'stripe', event_id: event.id, payload: event as unknown as Record<string, unknown>,
  });
  if (dupeErr && dupeErr.code === '23505') {
    return new Response('Already processed', { status: 200, headers: cors });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = (event.type === 'checkout.session.completed'
          ? await stripe.subscriptions.retrieve((event.data.object as Stripe.Checkout.Session).subscription as string)
          : (event.data.object as Stripe.Subscription));
        const userId = sub.metadata?.user_id;
        if (!userId) break;
        const priceId = sub.items.data[0]?.price.id;
        const tier = priceId ? tierFromPrice(priceId) : null;
        await sb.from('subscriptions').upsert({
          user_id: userId,
          tier: tier || 'starter',
          status: sub.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete',
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: 'user_id' });
        await sb.from('audit_log').insert({
          user_id: userId, action: 'subscription.updated',
          resource_type: 'subscription', resource_id: sub.id,
          metadata: { tier, status: sub.status },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;
        await sb.from('subscriptions').update({ tier: 'free', status: 'canceled' }).eq('user_id', userId);
        await sb.from('audit_log').insert({
          user_id: userId, action: 'subscription.canceled',
          resource_type: 'subscription', resource_id: sub.id,
        });
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = inv.customer as string;
        await sb.from('subscriptions').update({ status: 'past_due' }).eq('stripe_customer_id', customerId);
        break;
      }
    }
    return new Response('ok', { status: 200, headers: cors });
  } catch (e) {
    console.error('webhook handler error', e);
    return new Response('Handler error', { status: 500, headers: cors });
  }
});
