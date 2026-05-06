import { useAppStore } from '@/store/appStore';
import type { Client } from '@/types/respondfall';

interface Stats30 { missed: number; smsSent: number; missedToday: number; smsToday: number }

export function AnalyticsTab({ client, stats30 }: { client: Client; stats30: Stats30 }) {
  const { optOuts } = useAppStore();
  const m30 = stats30.missed;
  const s30 = stats30.smsSent;
  const rev30 = m30 * client.avg_job_value;
  const s7 = 0; // 7-day stats would need separate fetch; placeholder until implemented
  const m7 = 0;

  return (
    <div>
      {/* Revenue Hero */}
      <div className="bg-s1 border border-ember rounded-[14px] p-6 mb-3.5 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(var(--surface-1)), hsl(var(--surface-2)))' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5 gradient-bar" />
        <div className="text-xs font-mono text-t3 tracking-[.1em] uppercase mb-2">Estimated Revenue Protected · Last 30 Days</div>
        <div className="font-display text-[46px] font-bold text-ember tracking-[.03em] leading-none" style={{ textShadow: '0 0 24px hsl(var(--ember-glow))' }}>${rev30.toLocaleString()}</div>
        {m30 > 0 ? (
          <div className="text-xs text-t2 mt-1.5">{m30} missed calls × ${client.avg_job_value} avg · <strong className="text-success">ROI: {Math.round(rev30 / 497)}x investment</strong></div>
        ) : (
          <div className="text-xs text-t2 mt-1.5">Waiting for first missed call...</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3.5">
        {[
          { l: '7-Day Missed', v: String(m7), cls: 'text-sky' },
          { l: '7-Day SMS Sent', v: String(s7), cls: '' },
          { l: '30-Day Missed', v: String(m30), cls: '' },
          { l: '30-Day SMS', v: String(s30), cls: '' },
        ].map(s => (
          <div key={s.l} className="bg-s1 border border-blue rounded-xl p-4">
            <div className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-2">{s.l}</div>
            <div className={`font-display text-[30px] font-bold ${s.cls}`}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Weekly Report */}
      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2.5"><span className="w-[3px] h-4 gradient-indicator rounded-sm" />Weekly Revenue Report</span>
          <span className="text-[11px] font-mono text-success font-normal">Auto-sent every Monday</span>
        </div>
        <div className="bg-3 border border-blue rounded-[10px] p-4 text-xs text-t2 leading-loose">
          <div className="font-display text-[15px] text-foreground mb-2">📊 Respondfall AI Weekly Report — {client.name}</div>
          <strong className="text-foreground">Last 30 days:</strong> {m30} missed calls · {s30} SMS sent · <strong className="text-ember">${rev30.toLocaleString()} protected</strong><br />
          <span className="text-t3 text-[11px]">Respondfall AI · SkyforgeAI · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* TCPA Compliance */}
      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5">
          <span className="w-[3px] h-4 gradient-indicator rounded-sm" />
          TCPA Compliance
        </div>
        {optOuts.length === 0 ? (
          <div className="text-[13px] text-t3">No opt-outs. STOP requests are automatically logged and honored.</div>
        ) : (
          optOuts.map(p => (
            <div key={p} className="flex justify-between py-2 border-b border-[hsl(var(--border-light))]">
              <span className="font-mono text-[13px]">{p}</span>
              <span className="text-[10px] font-mono bg-[hsl(var(--destructive)/0.08)] text-destructive border border-destructive/20 rounded px-2 py-0.5">OPTED OUT</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
