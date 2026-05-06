import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types/respondfall';

interface PendingMsg {
  id: string;
  caller_number: string;
  body: string;
  send_at: string;
  step_label: string | null;
}

function relativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  let label: string;
  if (mins < 60) label = `${mins}m`;
  else if (hours < 24) label = `${hours}h`;
  else label = `${days}d`;
  return past ? `${label} ago` : `in ${label}`;
}

export function SequencesTab({ client }: { client: Client }) {
  const [pending, setPending] = useState<PendingMsg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client.id) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('client_id', client.id)
        .eq('status', 'pending')
        .order('send_at', { ascending: true })
        .limit(50);
      if (active) { setPending((data ?? []) as PendingMsg[]); setLoading(false); }
    })();
    return () => { active = false; };
  }, [client.id]);

  const cancelPending = async (id: string) => {
    const prev = pending;
    setPending(p => p.filter(x => x.id !== id));
    const { error } = await supabase.from('scheduled_messages').delete().eq('id', id);
    if (error) {
      setPending(prev);
      toast.error('Could not cancel — please try again');
      return;
    }
    toast.success('Follow-up cancelled');
  };

  const recoverySteps = [
    {
      num: 1,
      cls: 'gradient-sky border-primary glow-sky',
      delay: `Fires immediately (+${client.send_delay_seconds}s delay)`,
      msg: client.sms_template.replace(/{booking_link}/g, client.booking_link || '[link]').replace(/{business_name}/g, client.name),
    },
    {
      num: 2,
      cls: 'bg-[hsla(var(--sky-blue),0.25)] text-sky border-blue-2',
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

  const qualSteps = [
    {
      num: 'Q1',
      cls: 'bg-[hsla(var(--sky-blue),0.3)] text-sky border-blue-2',
      delay: 'Triggers on first inbound reply',
      msg: `Thanks for reaching out to ${client.name}! To help you faster, what brings you in?\n\n1️⃣ Get a Quote\n2️⃣ Book a Service\n3️⃣ Ask a Question`,
    },
    {
      num: 'Q2',
      cls: 'bg-[hsla(var(--sky-blue),0.2)] text-sky border-blue-2',
      delay: 'After reason selected — contextual follow-up',
      msg: `Great — can you briefly describe what you need? (e.g., "roof repair estimate" or "AC maintenance")`,
    },
    {
      num: '→',
      cls: 'bg-success-bg text-success border-success',
      delay: 'After follow-up answered — auto-route',
      msg: `Got it! Here's your next step:\n• Quote/Service → booking link sent\n• Question → owner notified instantly`,
    },
  ];

  const referralSteps = [
    {
      num: '🤝',
      cls: 'bg-[hsla(var(--sky-blue),0.25)] text-sky border-blue-2',
      delay: '30 min after "Mark Job Complete"',
      msg: `Thanks for choosing ${client.name}! Know someone who could use our help? Reply with their name and we'll take care of the rest — you're helping them get great service.`,
    },
    {
      num: '📋',
      cls: 'bg-ember-dim text-ember border-ember',
      delay: 'After referral name received',
      msg: `Awesome, thanks! We'll reach out to [Name]. Your unique referral code is REF-XXXXXX — we'll let you know when they book.`,
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* 3-Touch Recovery */}
      <SequenceCard
        title="3-Touch Recovery Sequence"
        description={<>Fires automatically for every missed call. Stops the moment they reply or book. <strong className="text-sky">Converts 30–40% of missed calls</strong> into booked appointments.</>}
        descCls="bg-sky-dim border-blue-2 border-l-primary"
        steps={recoverySteps}
      />

      {/* Qualification Layer */}
      <SequenceCard
        title="Lead Qualification Layer"
        description={<>Activates when a caller replies to the recovery sequence. <strong className="text-sky">Categorises intent in 2 messages</strong> then auto-routes to booking or owner notification.</>}
        descCls="bg-sky-dim border-blue-2 border-l-primary"
        steps={qualSteps}
      >
        <div className="grid grid-cols-3 gap-2 mt-3.5">
          {[
            { label: 'Quote', icon: '💰', desc: '→ Booking link' },
            { label: 'Service', icon: '🔧', desc: '→ Booking link' },
            { label: 'Question', icon: '❓', desc: '→ Owner alert' },
          ].map(r => (
            <div key={r.label} className="bg-3 border border-blue rounded-lg p-2.5 text-center">
              <div className="text-lg mb-1">{r.icon}</div>
              <div className="text-[11px] font-display font-bold text-foreground">{r.label}</div>
              <div className="text-[9px] font-mono text-t3 mt-0.5">{r.desc}</div>
            </div>
          ))}
        </div>
      </SequenceCard>

      {/* Review Request */}
      <div className="bg-s1 border border-blue rounded-xl p-5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5">
          <span className="w-[3px] h-4 gradient-indicator rounded-sm" />
          Post-Job Review Request
        </div>
        {client.google_review_link ? (
          <>
            <div className="bg-ember-dim border border-ember rounded-lg p-3 text-xs text-t2 mb-4 leading-relaxed border-l-[3px] border-l-accent">
              <strong className="text-ember">The flywheel is active:</strong> Mark a job complete → review request fires 2 hours later → more 5-star reviews → higher Google ranking → more calls to capture.
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
            Google Review Link is not set. Add it in Settings → Revenue Multipliers to unlock post-job review requests.
          </div>
        )}
      </div>

      {/* Referral Automation */}
      <SequenceCard
        title="Referral Automation"
        description={<>Triggers after job completion. <strong className="text-ember">Turns every happy customer into a referral source</strong> with unique tracking codes and automatic outreach.</>}
        descCls="bg-ember-dim border-ember border-l-accent"
        steps={referralSteps}
      >
        <div className="bg-3 border border-blue rounded-lg p-3 mt-3.5">
          <div className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-2">Referral Pipeline</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-sky-dim border border-blue-2 text-sky font-mono text-[10px]">SMS Sent</span>
            <span className="text-t4">→</span>
            <span className="px-2 py-1 rounded-md bg-ember-dim border border-ember text-ember font-mono text-[10px]">Name Captured</span>
            <span className="text-t4">→</span>
            <span className="px-2 py-1 rounded-md bg-success-bg border border-success text-success font-mono text-[10px]">Code Issued</span>
            <span className="text-t4">→</span>
            <span className="px-2 py-1 rounded-md bg-gold-bg border border-gold text-gold font-mono text-[10px]">Converted</span>
          </div>
        </div>
      </SequenceCard>

      {/* Sequence Performance */}
      <div className="bg-s1 border border-blue rounded-xl p-5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5">
          <span className="w-[3px] h-4 gradient-indicator rounded-sm" />
          Sequence Performance
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
          {[
            { l: 'Active Sequences', v: '4', c: 'text-sky' },
            { l: 'Qualification Rate', v: '72%', c: 'text-sky' },
            { l: 'Booking Conversion', v: '38%', c: 'text-success' },
            { l: 'Referrals Generated', v: '12', c: 'text-ember' },
          ].map(s => (
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

/* Reusable sequence card */
function SequenceCard({
  title,
  description,
  descCls,
  steps,
  children,
}: {
  title: string;
  description: React.ReactNode;
  descCls: string;
  steps: { num: string | number; cls: string; delay: string; msg: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-s1 border border-blue rounded-xl p-5">
      <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5">
        <span className="w-[3px] h-4 gradient-indicator rounded-sm" />
        {title}
      </div>
      <div className={`rounded-lg p-3 text-xs text-t2 mb-4 leading-relaxed border border-l-[3px] ${descCls}`}>
        {description}
      </div>
      {steps.map((s, i) => (
        <div key={i}>
          <div className="grid grid-cols-[28px_1fr] gap-3.5 items-start mb-3.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display text-[13px] font-bold flex-shrink-0 border ${s.cls}`}>
              {s.num}
            </div>
            <div className="bg-3 border border-blue rounded-lg p-3">
              <div className="text-[11px] font-mono text-ember mb-1.5 flex items-center gap-1.5">⏱ {s.delay}</div>
              <div className="text-xs text-t2 leading-relaxed whitespace-pre-line">"{s.msg}"</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="w-0.5 h-3.5 gradient-indicator mx-auto opacity-40 mb-1" style={{ marginLeft: '13px' }} />
          )}
        </div>
      ))}
      {children}
    </div>
  );
}
