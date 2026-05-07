import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TIERS, tierByName, type Tier } from '@/lib/tiers';

interface SubInfo {
  tier: Tier;
  status: string;
  current_period_end: string | null;
}

export function BillingTab() {
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [usage, setUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const startOfMonth = new Date();
      startOfMonth.setUTCDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);
      const [{ data: s }, { data: u }] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('tier, status, current_period_end')
          .eq('user_id', session.user.id)
          .maybeSingle(),
        supabase
          .from('usage_counters')
          .select('count')
          .eq('user_id', session.user.id)
          .eq('metric', 'sms_sent')
          .gte('period_start', startOfMonth.toISOString())
          .maybeSingle(),
      ]);
      setSub(
        s
          ? {
              tier: (s.tier as Tier) ?? 'free',
              status: s.status ?? 'active',
              current_period_end: s.current_period_end,
            }
          : { tier: 'free', status: 'active', current_period_end: null }
      );
      setUsage(u?.count ?? 0);
      setLoading(false);
    })();
  }, []);

  const currentTier = tierByName(sub?.tier);
  const isPaid = sub && sub.tier !== 'free';

  const upgrade = async (tier: Tier) => {
    setRedirecting(tier);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        setRedirecting(null);
        return;
      }
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { tier, returnUrl: window.location.origin },
      });
      if (error || !data?.url) {
        toast.error(error?.message || data?.error || 'Checkout unavailable');
        setRedirecting(null);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Checkout failed');
      setRedirecting(null);
    }
  };

  const manage = async () => {
    setRedirecting('manage');
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        body: { returnUrl: window.location.origin },
      });
      if (error || !data?.url) {
        toast.error(error?.message || data?.error || 'Billing portal unavailable');
        setRedirecting(null);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Portal failed');
      setRedirecting(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-t3 font-mono p-6">Loading billing…</div>;
  }

  const usagePct = Math.min(100, Math.round((usage / currentTier.smsPerMonth) * 100));

  return (
    <div>
      {/* Current plan + usage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-s1 border border-blue rounded-xl p-5">
          <div className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-2">
            Current Plan
          </div>
          <div className="font-display text-[26px] font-bold text-sky">{currentTier.label}</div>
          <div className="text-[12px] font-mono text-t3 mt-1">
            {currentTier.price} · status: {sub?.status}
          </div>
          {sub?.current_period_end && (
            <div className="text-[11px] font-mono text-t3 mt-1">
              Renews {new Date(sub.current_period_end).toLocaleDateString()}
            </div>
          )}
          {isPaid && (
            <button
              onClick={manage}
              disabled={!!redirecting}
              className="mt-3.5 w-full py-2.5 rounded-lg border border-blue-2 bg-transparent text-t2 font-display text-sm font-bold tracking-[.06em] uppercase hover:bg-s2 hover:text-foreground transition-all disabled:opacity-50"
            >
              {redirecting === 'manage' ? '◌ Opening portal…' : 'Manage / Cancel'}
            </button>
          )}
        </div>
        <div className="bg-s1 border border-blue rounded-xl p-5">
          <div className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-2">
            SMS Usage · This Month
          </div>
          <div className="font-display text-[26px] font-bold text-foreground">
            {usage.toLocaleString()}{' '}
            <span className="text-t3 text-base font-mono">
              / {currentTier.smsPerMonth.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-s3 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full ${usagePct >= 90 ? 'bg-destructive' : usagePct >= 70 ? 'bg-ember' : 'gradient-sky'}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <div className="text-[11px] font-mono text-t3 mt-2">{usagePct}% used</div>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="bg-s1 border border-blue rounded-xl p-5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5">
          <span className="w-[3px] h-4 gradient-indicator rounded-sm" />
          Plans
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10px] font-mono text-t3 uppercase tracking-[.1em]">
                <th className="text-left py-2 pr-3">Plan</th>
                <th className="text-left py-2 pr-3">Price</th>
                <th className="text-left py-2 pr-3">SMS/mo</th>
                <th className="text-left py-2 pr-3">Clients</th>
                <th className="text-left py-2 pr-3">AI Replies</th>
                <th className="text-left py-2"></th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => {
                const isCurrent = sub?.tier === t.id;
                const isUpgrade =
                  TIERS.findIndex((x) => x.id === t.id) >
                  TIERS.findIndex((x) => x.id === (sub?.tier ?? 'free'));
                return (
                  <tr
                    key={t.id}
                    className={`border-t border-[hsl(var(--border-light))] ${isCurrent ? 'bg-sky-dim' : ''}`}
                  >
                    <td className="py-3 pr-3 font-display font-bold text-foreground">{t.label}</td>
                    <td className="py-3 pr-3 font-mono">{t.price}</td>
                    <td className="py-3 pr-3 font-mono">{t.smsPerMonth.toLocaleString()}</td>
                    <td className="py-3 pr-3 font-mono">{t.clients}</td>
                    <td className="py-3 pr-3">{t.aiReplies ? '✓' : '—'}</td>
                    <td className="py-3 text-right">
                      {isCurrent ? (
                        <span className="text-[11px] font-mono text-sky">Current</span>
                      ) : isUpgrade ? (
                        <button
                          onClick={() => upgrade(t.id)}
                          disabled={!!redirecting}
                          className="gradient-sky text-primary-foreground rounded-md px-3 py-1.5 text-[11px] font-mono font-semibold tracking-[.04em] hover:glow-sky transition-all disabled:opacity-50"
                        >
                          {redirecting === t.id ? '◌ …' : `Upgrade to ${t.label}`}
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-t3">Lower tier</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="text-[11px] font-mono text-t3 mt-4">
          All paid plans include AI-generated replies, your dedicated Respondfall number, and full
          inbox access.
        </div>
      </div>
    </div>
  );
}
