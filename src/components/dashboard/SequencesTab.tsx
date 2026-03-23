import type { Client } from '@/types/respondfall';

export function SequencesTab({ client }: { client: Client }) {
  const steps = [
    {
      num: 1,
      cls: 'gradient-sky border-primary glow-sky',
      delay: `Fires immediately (+${client.send_delay_seconds}s delay)`,
      msg: client.sms_template.replace(/{booking_link}/g, client.booking_link || '[link]').replace(/{business_name}/g, client.name),
    },
    {
      num: 2,
      cls: 'bg-[rgba(30,127,212,0.25)] text-sky border-blue-2',
      delay: '2 hours later — if no reply',
      msg: `Hey, still hoping to connect — ${client.name} has availability this week. Book anytime: ${client.booking_link || '[link]'}.`,
    },
    {
      num: 3,
      cls: 'bg-ember-dim text-ember border-ember',
      delay: '24 hours later — final touchpoint',
      msg: `Last check-in from ${client.name} — we'd love to help. Book when ready: ${client.booking_link || '[link]'}. Reply STOP to unsubscribe.`,
    },
  ];

  return (
    <div>
      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5">
          <span className="w-[3px] h-4 gradient-indicator rounded-sm" />
          3-Touch Recovery Sequence
        </div>
        <div className="bg-sky-dim border border-blue-2 rounded-lg p-3 text-xs text-t2 mb-4 leading-relaxed border-l-[3px] border-l-primary">
          Fires automatically for every missed call. Stops the moment they reply or book. <strong className="text-sky">Converts 30–40% of missed calls</strong> into booked appointments.
        </div>

        {steps.map((s, i) => (
          <div key={s.num}>
            <div className="grid grid-cols-[28px_1fr] gap-3.5 items-start mb-3.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display text-[13px] font-bold flex-shrink-0 border text-primary-foreground ${s.cls}`}>{s.num}</div>
              <div className="bg-3 border border-blue rounded-lg p-3">
                <div className="text-[11px] font-mono text-ember mb-1.5 flex items-center gap-1.5">⏱ {s.delay}</div>
                <div className="text-xs text-t2 leading-relaxed">"{s.msg}"</div>
              </div>
            </div>
            {i < steps.length - 1 && <div className="w-0.5 h-3.5 gradient-indicator mx-auto opacity-40 mb-1" style={{ marginLeft: '13px' }} />}
          </div>
        ))}
      </div>

      {/* Review sequence */}
      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5">
          <span className="w-[3px] h-4 gradient-indicator rounded-sm" />
          Post-Job Review Request
        </div>
        {client.google_review_link ? (
          <>
            <div className="bg-ember-dim border border-ember rounded-lg p-3 text-xs text-t2 mb-4 leading-relaxed border-l-[3px] border-l-accent">
              <strong className="text-ember">The flywheel is active:</strong> Mark a job complete in the Inbox → review request fires 2 hours later → more 5-star reviews → higher Google ranking → more calls to capture.
            </div>
            <div className="grid grid-cols-[28px_1fr] gap-3.5 items-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-display text-[13px] font-bold flex-shrink-0 border bg-gold-bg text-gold border-gold">⭐</div>
              <div className="bg-3 border border-blue rounded-lg p-3">
                <div className="text-[11px] font-mono text-ember mb-1.5 flex items-center gap-1.5">⏱ Fires 2 hours after "Mark Job Complete"</div>
                <div className="text-xs text-gold leading-relaxed">
                  "Thanks for choosing {client.name}! If we did a great job today, a quick Google review means the world to us: {client.google_review_link} — only takes 30 seconds!"
                </div>
              </div>
            </div>
            <div className="bg-success-bg border border-success rounded-lg p-2.5 text-xs text-success mt-3.5">
              Go to Inbox → tap "Mark Complete → Send Review Request" on any conversation to trigger this.
            </div>
          </>
        ) : (
          <div className="bg-[hsl(var(--warning-bg))] border border-[hsl(var(--warning-border))] rounded-lg p-3 text-xs text-[hsl(var(--warning))] leading-relaxed">
            Google Review Link is not set. Add it in Settings → Revenue Multipliers to unlock post-job review requests — this is the single highest-ROI feature.
          </div>
        )}
      </div>

      {/* Sequence perf */}
      <div className="bg-s1 border border-blue rounded-xl p-5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5">
          <span className="w-[3px] h-4 gradient-indicator rounded-sm" />
          Sequence Performance
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{ l: 'Active Sequences', v: '2', c: 'text-sky' }, { l: 'Step 2 Rate', v: '64%', c: '' }, { l: 'Conversion', v: '38%', c: 'text-success' }].map(s => (
            <div key={s.l} className="bg-3 border border-blue rounded-[10px] p-3.5">
              <div className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-2">{s.l}</div>
              <div className={`font-display text-[26px] font-bold ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
