import { useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types/respondfall';

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function ActivityTab({ client }: { client: Client }) {
  const { callLogs, smsLog, simulateCall, setConfirmDel, vmailOpen, toggleVmail, activityLoading } = useAppStore();
  const [testing, setTesting] = useState(false);

  const handleTestSetup = async () => {
    if (testing) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-twilio-connection');
      if (error || !data?.ok) {
        const msg = data?.error || error?.message || 'Unknown error';
        toast.error(`Twilio connection failed: ${msg}. Check your credentials in Settings → Connect.`);
        return;
      }
      toast.success('✅ Twilio connected — running test sequence...');
      await simulateCall();
    } catch (e: any) {
      toast.error(`Twilio connection failed: ${e?.message || 'network error'}. Check your credentials in Settings → Connect.`);
    } finally {
      setTesting(false);
    }
  };

  const merged = [
    ...callLogs.map(c => ({ ...c, _t: 'call' as const, _ts: c.received_at })),
    ...smsLog.filter(s => s.direction === 'outbound').map(s => ({ ...s, _t: 'sms' as const, _ts: s.sent_at })),
  ].sort((a, b) => b._ts.localeCompare(a._ts));

  return (
    <div>
      {/* Sim bar */}
      <div className="bg-s1 border border-ember rounded-[10px] p-3 px-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2.5" style={{ background: 'linear-gradient(135deg, hsl(var(--surface-1)), hsl(var(--surface-2)))' }}>
        <span className="text-xs text-t2 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-dot flex-shrink-0" />
          <span className="hidden sm:inline">Test your Respondfall deployment — simulate a live missed call</span>
          <span className="sm:hidden">Simulate a missed call</span>
        </span>
        <div className="flex gap-2 flex-shrink-0">
          <button className="bg-[hsl(var(--destructive)/0.08)] text-destructive border border-destructive/20 rounded-[7px] py-1.5 px-3 cursor-pointer text-[11px] font-mono flex items-center gap-1 hover:bg-[hsl(var(--destructive)/0.15)] transition-all" onClick={() => setConfirmDel({ type: 'activity', id: 'all', label: 'all activity' })}>
            🗑 Clear
          </button>
          <button
            className="gradient-ember text-primary-foreground border-none rounded-lg py-2 px-4 font-display text-xs font-bold tracking-[.06em] uppercase cursor-pointer glow-ember hover:-translate-y-px transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            onClick={handleTestSetup}
            disabled={testing}
          >
            {testing ? '◌ CHECKING...' : '🔬 TEST SETUP'}
          </button>
        </div>
      </div>

      {merged.length === 0 ? (
        <div className="text-center py-12 px-5 bg-s1 border border-dashed border-blue-2 rounded-xl">
          <div className="text-4xl mb-3">📡</div>
          <div className="text-[15px] font-display font-bold text-foreground mb-2">You're live — waiting for your first call</div>
          <div className="text-[12px] text-t3 font-mono leading-relaxed max-w-md mx-auto mb-4">
            When someone calls your Respondfall number and hangs up or goes to voicemail, it will appear here instantly. Your automated SMS sequence fires within seconds.
          </div>
          <button
            className="gradient-ember text-primary-foreground border-none rounded-lg py-1.5 px-4 font-display text-[11px] font-bold tracking-[.06em] uppercase cursor-pointer glow-ember hover:-translate-y-px transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleTestSetup}
            disabled={testing}
          >
            {testing ? '◌ CHECKING...' : '🔬 Test Your Setup'}
          </button>
        </div>
      ) : (
        merged.map(item => {
          const isSms = item._t === 'sms';
          const step = isSms ? (item as any).step : null;
          const isReview = step === 'review';
          const isAi = step === 'ai';

          const iconClass = isSms
            ? isReview ? 'bg-gold-bg border-gold' : isAi ? 'bg-purple-bg border-purple' : step === 'qual' ? 'bg-amber-500/10 border-amber-500/30' : step === 'referral' ? 'bg-purple-bg border-purple' : 'bg-success-bg border-success'
            : 'bg-[hsl(var(--destructive)/0.08)] border-destructive/20';
          const icon = isSms ? (isReview ? '⭐' : isAi ? '🤖' : step === 'qual' ? '✦' : step === 'referral' ? '🤝' : step === 2 ? '🔄' : step === 3 ? '⏰' : '💬') : '📵';

          const stepLabel = isSms
            ? isReview ? 'Review' : step === 1 ? 'Step 1' : step === 2 ? 'Step 2' : step === 3 ? 'Step 3' : isAi ? '✦ AI' : step === 'manual' ? 'Manual' : step === 'qual' ? 'Qualify' : step === 'referral' ? 'Referral' : 'SMS'
            : '';

          const isCall = item._t === 'call';
          const hasVmail = isCall && (item as any).voicemail && (item as any).voicemail_transcript;
          const vmId = `vm-${item.id}`;

          return (
            <div key={item.id} className="bg-s1 border border-blue rounded-[10px] p-3 px-3 sm:px-4 grid grid-cols-[32px_1fr_auto] sm:grid-cols-[38px_1fr_auto] gap-2 sm:gap-3 items-start animate-fade-up mb-2 hover:border-blue-2 transition-colors">
              <div className={`w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-lg flex items-center justify-center text-[15px] sm:text-[17px] flex-shrink-0 mt-0.5 border ${iconClass}`}>
                {icon}
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[12px] sm:text-[13px] font-medium text-foreground mb-0.5 truncate">
                  {isSms ? (item as any).to_number : (item as any).caller_number}
                </div>
                <div className="text-[11px] text-t2 leading-relaxed line-clamp-2">
                  {isSms ? (
                    <>
                      {stepLabel && <span className={`font-semibold ${isReview ? 'text-gold' : isAi ? 'text-purple-brand' : 'text-sky'}`}>[{stepLabel}]</span>}{' '}
                      {(item as any).body}
                    </>
                  ) : (
                    `Missed call (${(item as any).call_status}) · sequence triggered`
                  )}
                </div>
                {hasVmail && (
                  <div className="mt-2 bg-3 border border-purple/30 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-purple-bg/50 transition-colors" onClick={() => toggleVmail(vmId)}>
                      <span className="text-[11px] font-mono text-purple-brand tracking-[.06em] flex items-center gap-1.5">🎙 Voicemail</span>
                      <span className="text-[10px] text-t3 ml-auto">{vmailOpen[vmId] ? '▲' : '▼'}</span>
                    </div>
                    {vmailOpen[vmId] && (
                      <div className="px-3 py-2.5 border-t border-purple/20">
                        <div className="text-[9px] font-mono text-purple-brand uppercase tracking-[.1em] mb-1.5">AI Transcript</div>
                        <div className="italic text-foreground text-xs leading-relaxed border-l-2 border-purple-brand/50 pl-2.5">
                          {(item as any).voicemail_transcript}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="font-mono text-[9px] sm:text-[10px] text-t3 whitespace-nowrap">{formatTime(item._ts)}</div>
                {(() => {
                  const status = isSms ? (item as any).status : null;
                  const isDelivered = isSms && status === 'delivered';
                  const isFailed = isSms && (status === 'failed' || status === 'undelivered');
                  const badgeCls = !isSms
                    ? 'bg-[hsl(var(--destructive)/0.08)] text-destructive border-destructive/20'
                    : isFailed
                      ? 'bg-[hsl(var(--destructive)/0.08)] text-destructive border-destructive/20'
                      : isDelivered
                        ? 'bg-success-bg text-success border-success'
                        : isReview ? 'bg-gold-bg text-gold border-gold'
                        : isAi ? 'bg-purple-bg text-purple-brand border-purple'
                        : step === 'qual' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : step === 'referral' ? 'bg-purple-bg text-purple-brand border-purple'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/30';
                  const label = !isSms
                    ? 'MISSED'
                    : isFailed ? '⚠ FAILED'
                    : isDelivered ? 'DELIVERED'
                    : isReview ? 'REVIEW'
                    : step === 'qual' ? 'QUALIFY'
                    : step === 'referral' ? 'REFERRAL'
                    : 'SENT';
                  return (
                    <span className={`text-[9px] sm:text-[10px] font-semibold font-mono px-1.5 sm:px-2 py-0.5 rounded border ${badgeCls}`}>
                      {label}
                    </span>
                  );
                })()}
                <button
                  className="bg-[hsl(var(--destructive)/0.08)] text-destructive border border-destructive/20 rounded-[7px] py-1 px-2 cursor-pointer text-[11px] font-mono flex items-center gap-1 hover:bg-[hsl(var(--destructive)/0.15)] transition-all mt-0.5"
                  onClick={() => setConfirmDel({ type: 'feed-item', id: item.id, label: 'this entry' })}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
