import { useAppStore } from '@/store/appStore';
import type { Client, Conversation, SmsLog } from '@/types/respondfall';

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getConversations(smsLog: SmsLog[]): Conversation[] {
  const map = new Map<string, SmsLog[]>();
  smsLog.forEach((m) => {
    const phone = m.direction === 'outbound' ? m.to_number : m.from_number;
    if (!map.has(phone)) map.set(phone, []);
    map.get(phone)!.push(m);
  });
  return Array.from(map.entries())
    .map(([phone, messages]) => {
      messages.sort((a, b) => a.sent_at.localeCompare(b.sent_at));
      const intents = [...new Set(messages.filter((m) => m.intent).map((m) => m.intent!))];
      return {
        phone,
        messages,
        lastAt: messages[messages.length - 1].sent_at,
        hasInbound: messages.some((m) => m.direction === 'inbound'),
        intents,
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

const intentTag = (i: string) => {
  switch (i) {
    case 'emergency':
      return 'bg-[hsl(var(--destructive)/0.08)] text-destructive border-destructive/20';
    case 'quote':
      return 'bg-sky-dim text-sky border-blue-2';
    case 'service':
      return 'bg-success-bg text-success border-success';
    case 'appointment':
      return 'bg-success-bg text-success border-success';
    case 'referral':
      return 'bg-purple-bg text-purple-brand border-purple';
    default:
      return 'bg-ember-dim text-ember border-ember';
  }
};
const intentLabel = (i: string) => {
  switch (i) {
    case 'emergency':
      return '🚨 URGENT';
    case 'quote':
      return '💬 QUOTE';
    case 'service':
      return '🔧 SERVICE';
    case 'appointment':
      return '✓ APPT';
    case 'referral':
      return '🤝 REFERRAL';
    case 'question':
      return '❓ QUESTION';
    default:
      return i.toUpperCase();
  }
};

const stepLabel = (step: string | number | undefined) => {
  if (step === 'qual') return { text: '✦ Qualify', cls: 'text-amber-500' };
  if (step === 'referral') return { text: '🤝 Referral', cls: 'text-purple-brand' };
  if (step === 'ai') return { text: '✦ AI', cls: '' };
  if (step === 'manual') return { text: 'Manual', cls: '' };
  if (step === 'review') return { text: '⭐ Review', cls: '' };
  if (typeof step === 'number') return { text: `Step ${step}`, cls: '' };
  return null;
};

export function InboxTab({ client }: { client: Client }) {
  const {
    smsLog,
    optOuts,
    reviewsSent,
    replyTexts,
    setReplyText,
    sendReply,
    markDone,
    stopSequence,
    setConfirmDel,
    qualFlows,
    referrals,
    sendReferralRequest,
    activityLoading,
  } = useAppStore();
  const convos = getConversations(smsLog);

  return (
    <div>
      <div className="flex items-center justify-between mb-3.5 gap-2">
        <div className="text-xs font-mono text-t3">
          {convos.length} conversation{convos.length !== 1 ? 's' : ''}
        </div>
        <button
          className="bg-[hsl(var(--destructive)/0.08)] text-destructive border border-destructive/20 rounded-[7px] py-1.5 px-3 cursor-pointer text-[11px] font-mono flex items-center gap-1 hover:bg-[hsl(var(--destructive)/0.15)] transition-all flex-shrink-0"
          onClick={() => setConfirmDel({ type: 'inbox', id: 'all', label: 'all conversations' })}
        >
          🗑 Clear All
        </button>
      </div>

      {activityLoading && convos.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-s1 border border-blue rounded-xl p-4 animate-pulse h-[120px]"
            />
          ))}
        </div>
      ) : convos.length === 0 ? (
        <div className="text-center py-12 px-5 bg-s1 border border-dashed border-blue-2 rounded-xl">
          <div className="text-4xl mb-3">💬</div>
          <div className="text-[15px] font-display font-bold text-foreground mb-2">
            No conversations yet
          </div>
          <div className="text-[12px] text-t3 font-mono leading-relaxed max-w-md mx-auto">
            When a missed caller texts back in response to your automated sequence, the conversation
            will appear here. You can reply manually or let the AI qualification flow continue.
          </div>
        </div>
      ) : (
        convos.map((cv) => {
          const isOptOut = optOuts.includes(cv.phone);
          const revSent = reviewsSent[cv.phone];
          const rt = replyTexts[cv.phone] || '';
          const qualFlow = qualFlows.find((q) => q.phone === cv.phone);
          const phoneReferrals = referrals.filter((r) => r.phone === cv.phone);
          const hasReferralSent = cv.messages.some(
            (m) => m.step === 'referral' && m.direction === 'outbound'
          );

          return (
            <div
              key={cv.phone}
              className={`bg-s1 border rounded-xl p-3 sm:p-4 mb-3 transition-colors animate-fade-up ${cv.hasInbound ? 'border-ember' : revSent ? 'border-gold' : 'border-blue'}`}
            >
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-sm font-medium text-foreground truncate">
                    {cv.phone}
                  </div>
                  <div className="text-[10px] font-mono text-t3 mt-0.5">
                    {formatDate(cv.lastAt)} · {cv.messages.length} msg
                  </div>
                </div>
                <div className="flex gap-1.5 items-start flex-shrink-0 flex-wrap justify-end">
                  {qualFlow && (
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border ${
                        qualFlow.stage === 'routed'
                          ? qualFlow.routedTo === 'booking'
                            ? 'bg-success-bg text-success border-success'
                            : 'bg-ember-dim text-ember border-ember'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      }`}
                    >
                      {qualFlow.stage === 'routed'
                        ? qualFlow.routedTo === 'booking'
                          ? '📅 ROUTED'
                          : '📋 NOTIFIED'
                        : '⏳ QUALIFYING'}
                    </span>
                  )}
                  {cv.intents.map((i) => (
                    <span
                      key={i}
                      className={`text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded border ${intentTag(i)}`}
                    >
                      {intentLabel(i)}
                    </span>
                  ))}
                  <button
                    className="bg-[hsl(var(--destructive)/0.08)] text-destructive border border-destructive/20 rounded-[7px] py-1 px-2 cursor-pointer text-[11px] font-mono hover:bg-[hsl(var(--destructive)/0.15)] transition-all"
                    onClick={() =>
                      setConfirmDel({
                        type: 'convo',
                        id: cv.phone,
                        label: `conversation with ${cv.phone}`,
                      })
                    }
                  >
                    🗑
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-3">
                {cv.messages.slice(-8).map((m) => {
                  const sl = stepLabel(m.step);
                  return (
                    <div
                      key={m.id}
                      className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[85%] sm:max-w-[78%]">
                        <div
                          className={`px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                            m.direction === 'outbound'
                              ? m.step === 'review'
                                ? 'bg-gold-bg border border-gold rounded-xl rounded-br-sm text-gold'
                                : m.step === 'qual'
                                  ? 'bg-amber-500/10 border border-amber-500/30 rounded-xl rounded-br-sm text-foreground'
                                  : m.step === 'referral'
                                    ? 'bg-purple-bg border border-purple rounded-xl rounded-br-sm text-foreground'
                                    : 'gradient-sky text-primary-foreground rounded-xl rounded-br-sm'
                              : 'bg-s2 text-foreground border border-blue rounded-xl rounded-bl-sm'
                          }`}
                        >
                          {m.body}
                        </div>
                        <div className="text-[9px] font-mono text-t3 mt-0.5 text-right flex items-center justify-end gap-1.5">
                          {m.direction === 'outbound' &&
                            (() => {
                              const st = m.status;
                              if (st === 'delivered')
                                return <span className="text-success">✓ DELIVERED</span>;
                              if (st === 'failed' || st === 'undelivered')
                                return <span className="text-destructive">⚠ FAILED</span>;
                              return <span className="text-amber-500">SENT</span>;
                            })()}
                          <span>{formatTime(m.sent_at)}</span>
                          {sl && <span className={sl.cls}> · {sl.text}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Referral tracking cards */}
              {phoneReferrals.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {phoneReferrals.map((ref) => (
                    <div
                      key={ref.id}
                      className="bg-purple-bg border border-purple rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="text-purple-brand font-semibold">🤝 Referral:</span>{' '}
                        <span className="text-foreground">{ref.referredName}</span>
                        {ref.referredPhone && (
                          <span className="text-t3 ml-1.5 font-mono">{ref.referredPhone}</span>
                        )}
                      </div>
                      <span className="font-mono text-[9px] text-purple-brand bg-purple-bg border border-purple px-1.5 py-0.5 rounded">
                        {ref.trackingCode}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {revSent && (
                <div
                  className="bg-gold-bg border border-gold rounded-lg px-3 py-2 mt-2 text-xs text-gold flex items-center gap-2"
                  style={{ animation: 'reviewPop 0.4s ease' }}
                >
                  ⭐ Review Request Sent —{' '}
                  {client.google_review_link ? 'Link included' : 'Add review link in Settings'}
                </div>
              )}

              {isOptOut ? (
                <div className="text-center text-[11px] font-mono text-destructive bg-[hsl(var(--destructive)/0.08)] rounded-md py-1.5 border border-destructive/20">
                  OPTED OUT · STOP received · TCPA Compliant
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-3 border border-blue rounded-lg text-foreground font-body text-xs px-3 py-2.5 outline-none focus:border-primary transition-colors"
                      placeholder={`Reply as ${client.name}...`}
                      value={rt}
                      onChange={(e) => setReplyText(cv.phone, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendReply(cv.phone, rt)}
                    />
                    <button
                      className="gradient-sky text-primary-foreground border-none rounded-lg px-4 cursor-pointer font-display font-bold text-xs tracking-[.06em] hover:glow-sky transition-all active:scale-[0.95]"
                      onClick={() => sendReply(cv.phone, rt)}
                    >
                      SEND
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    <button
                      className="text-[10px] sm:text-[11px] font-mono py-1.5 px-2.5 rounded-md cursor-pointer border border-blue bg-transparent text-t2 hover:border-gold hover:text-gold hover:bg-gold-bg transition-all flex items-center gap-1"
                      onClick={() => markDone(cv.phone)}
                    >
                      ⭐ Complete → Review
                    </button>
                    {revSent && !hasReferralSent && (
                      <button
                        className="text-[10px] sm:text-[11px] font-mono py-1.5 px-2.5 rounded-md cursor-pointer border border-purple bg-transparent text-purple-brand hover:bg-purple-bg transition-all flex items-center gap-1"
                        onClick={() => sendReferralRequest(cv.phone)}
                      >
                        🤝 Ask for Referral
                      </button>
                    )}
                    <button
                      className="text-[10px] sm:text-[11px] font-mono py-1.5 px-2.5 rounded-md cursor-pointer border border-blue bg-transparent text-t2 hover:border-ember hover:text-ember hover:bg-ember-dim transition-all flex items-center gap-1"
                      onClick={() => stopSequence(cv.phone)}
                    >
                      ⏹ Stop Sequence
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
