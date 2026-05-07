import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types/respondfall';

interface Stats30 {
  missed: number;
  smsSent: number;
  missedToday: number;
  smsToday: number;
  confirmed: number;
}

export function AnalyticsTab({ client, stats30 }: { client: Client; stats30: Stats30 }) {
  const { optOuts, smsLog } = useAppStore();
  const [stats7, setStats7] = useState({ missed: 0, sms: 0 });
  const m30 = stats30.missed;
  const s30 = stats30.smsSent;
  const confirmed30 = stats30.confirmed;
  const rev30 = m30 * client.avg_job_value;
  const revConfirmed = confirmed30 * client.avg_job_value;

  useEffect(() => {
    if (!client.id) return;
    const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
    Promise.all([
      supabase
        .from('missed_calls')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .gte('called_at', since7),
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('direction', 'outbound')
        .gte('sent_at', since7),
    ]).then(([calls, msgs]) => setStats7({ missed: calls.count ?? 0, sms: msgs.count ?? 0 }));
  }, [client.id]);

  return (
    <div>
      {/* Revenue Hero */}
      {m30 === 0 ? (
        <div className="bg-s1 border border-dashed border-blue-2 rounded-[14px] p-8 mb-3.5 text-center">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-[15px] font-display font-bold text-foreground mb-2">
            Revenue tracking starts with your first call
          </div>
          <div className="text-[12px] text-t3 font-mono leading-relaxed max-w-md mx-auto">
            Once missed calls start coming in, you'll see estimated revenue protected here based on
            your average job value of{' '}
            <span className="text-ember font-semibold">${client.avg_job_value}</span>.
          </div>
        </div>
      ) : (
        <div
          className="bg-s1 border border-ember rounded-[14px] p-6 mb-3.5 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--surface-1)), hsl(var(--surface-2)))',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 gradient-bar" />
          <div className="text-xs font-mono text-t3 tracking-[.1em] uppercase mb-2">
            Estimated Revenue at Stake · Last 30 Days
          </div>
          <div
            className="font-display text-[46px] font-bold text-ember tracking-[.03em] leading-none"
            style={{ textShadow: '0 0 24px hsl(var(--ember-glow))' }}
          >
            ${rev30.toLocaleString()}
          </div>
          <div className="text-xs text-t2 mt-1.5">
            {m30} missed calls × ${client.avg_job_value} avg ·{' '}
            <strong className="text-success">
              {(() => {
                const outboundTos = new Set(
                  smsLog
                    .filter((m) => m.direction === 'outbound' && m.to_number)
                    .map((m) => m.to_number)
                );
                const repliedFroms = new Set(
                  smsLog
                    .filter(
                      (m) =>
                        m.direction === 'inbound' && m.from_number && outboundTos.has(m.from_number)
                    )
                    .map((m) => m.from_number)
                );
                const recoveredCount = repliedFroms.size;
                const pct = m30 > 0 ? Math.round((recoveredCount / m30) * 100) : 0;
                return `${recoveredCount} of ${m30} callers replied (${pct}% reply rate)`;
              })()}
            </strong>
          </div>
        </div>
      )}

      {/* Confirmed Revenue Recovered */}
      <div className="bg-s1 border border-success rounded-[14px] p-5 mb-3.5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-success" />
        <div className="text-[10px] font-mono text-t3 tracking-[.1em] uppercase mb-1">
          Confirmed Revenue Recovered · Last 30 Days
        </div>
        <div className="font-display text-[36px] font-bold text-success leading-none">
          ${revConfirmed.toLocaleString()}
        </div>
        <div className="text-xs text-t2 mt-1.5">
          {confirmed30} job{confirmed30 !== 1 ? 's' : ''} marked complete × ${client.avg_job_value} avg
          {m30 > 0 && (
            <span className="text-t3">
              {' '}· {Math.round((confirmed30 / m30) * 100)}% close rate
            </span>
          )}
        </div>
        <div className="text-[11px] font-mono text-t3 mt-2">
          Mark a job complete in Inbox → revenue logs here automatically
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3.5">
        {[
          { l: '7-Day Missed', v: String(stats7.missed), cls: 'text-sky' },
          { l: '7-Day SMS Sent', v: String(stats7.sms), cls: '' },
          { l: '30-Day Missed', v: String(m30), cls: '' },
          { l: '30-Day SMS', v: String(s30), cls: '' },
        ].map((s) => (
          <div key={s.l} className="bg-s1 border border-blue rounded-xl p-4">
            <div className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-2">
              {s.l}
            </div>
            <div className={`font-display text-[30px] font-bold ${s.cls}`}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Weekly Report */}
      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="w-[3px] h-4 gradient-indicator rounded-sm" />
            Weekly Revenue Report
          </span>
          <span className="text-[11px] font-mono text-success font-normal">
            Auto-sent every Monday
          </span>
        </div>
        <div className="bg-3 border border-blue rounded-[10px] p-4 text-xs text-t2 leading-loose">
          <div className="font-display text-[15px] text-foreground mb-2">
            📊 Respondfall AI Weekly Report — {client.name}
          </div>
          <strong className="text-foreground">Last 30 days:</strong> {m30} missed calls · {s30} SMS
          sent · <strong className="text-ember">${rev30.toLocaleString()} protected</strong>
          {confirmed30 > 0 && (
            <> · <strong className="text-success">${revConfirmed.toLocaleString()} confirmed recovered</strong></>
          )}
          <br />
          <span className="text-t3 text-[11px]">
            Respondfall AI ·{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* TCPA Compliance */}
      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5">
          <span className="w-[3px] h-4 gradient-indicator rounded-sm" />
          TCPA Compliance
        </div>
        {optOuts.length === 0 ? (
          <div className="text-[13px] text-t3">
            No opt-outs. STOP requests are automatically logged and honored.
          </div>
        ) : (
          optOuts.map((p) => (
            <div
              key={p}
              className="flex justify-between py-2 border-b border-[hsl(var(--border-light))]"
            >
              <span className="font-mono text-[13px]">{p}</span>
              <span className="text-[10px] font-mono bg-[hsl(var(--destructive)/0.08)] text-destructive border border-destructive/20 rounded px-2 py-0.5">
                OPTED OUT
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
