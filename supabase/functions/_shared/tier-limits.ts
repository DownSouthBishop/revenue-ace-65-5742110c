// Shared tier enforcement for edge functions.
// Server-side source of truth — never trust client.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type Tier = 'free' | 'starter' | 'growth' | 'agency';

export interface TierLimits {
  smsPerMonth: number;
  clients: number;
  phoneNumbers: number;
  aiReplies: boolean;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free:    { smsPerMonth: 20,   clients: 1,  phoneNumbers: 1,  aiReplies: false },
  starter: { smsPerMonth: 150,  clients: 1,  phoneNumbers: 1,  aiReplies: true  },
  growth:  { smsPerMonth: 500,  clients: 3,  phoneNumbers: 3,  aiReplies: true  },
  agency:  { smsPerMonth: 2000, clients: 25, phoneNumbers: 25, aiReplies: true  },
};

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

export async function getUserTier(sb: SupabaseClient, userId: string): Promise<Tier> {
  const { data } = await sb.from('subscriptions').select('tier, status').eq('user_id', userId).maybeSingle();
  if (!data) return 'free';
  if (!['active', 'trialing'].includes(data.status)) return 'free';
  return (data.tier as Tier) ?? 'free';
}

function monthBounds(d = new Date()) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Atomically increment usage counter and return the new value. */
export async function incrementUsage(
  sb: SupabaseClient,
  userId: string,
  metric: 'sms_sent' | 'ai_calls',
  by = 1,
): Promise<number> {
  const { start, end } = monthBounds();
  const { data: existing } = await sb
    .from('usage_counters')
    .select('id, count')
    .eq('user_id', userId).eq('metric', metric).eq('period_start', start)
    .maybeSingle();
  if (existing) {
    const next = existing.count + by;
    await sb.from('usage_counters').update({ count: next, updated_at: new Date().toISOString() }).eq('id', existing.id);
    return next;
  }
  await sb.from('usage_counters').insert({
    user_id: userId, metric, period_start: start, period_end: end, count: by,
  });
  return by;
}

export async function getMonthlyUsage(sb: SupabaseClient, userId: string, metric: string): Promise<number> {
  const { start } = monthBounds();
  const { data } = await sb.from('usage_counters').select('count')
    .eq('user_id', userId).eq('metric', metric).eq('period_start', start).maybeSingle();
  return data?.count ?? 0;
}

/** Throws if user is over their tier limit. Use BEFORE the chargeable action. */
export async function assertWithinTier(
  sb: SupabaseClient,
  userId: string,
  metric: 'sms_sent',
): Promise<{ tier: Tier; used: number; limit: number }> {
  const tier = await getUserTier(sb, userId);
  const limit = TIER_LIMITS[tier].smsPerMonth;
  const used = await getMonthlyUsage(sb, userId, metric);
  if (used >= limit) {
    throw new Error(`Tier limit exceeded: ${tier} allows ${limit} ${metric}/mo (used ${used}). Upgrade to continue.`);
  }
  return { tier, used, limit };
}

export async function audit(
  sb: SupabaseClient,
  userId: string | null,
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata: Record<string, unknown> = {},
) {
  await sb.from('audit_log').insert({
    user_id: userId, action, resource_type: resourceType ?? null,
    resource_id: resourceId ?? null, metadata,
  });
}
