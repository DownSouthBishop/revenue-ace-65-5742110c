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
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getConversations(smsLog: SmsLog[]): Conversation[] {
  const map = new Map<string, SmsLog[]>();
  smsLog.forEach(m => {
    const phone = m.direction === 'outbound' ? m.to_number : m.from_number;
    if (!map.has(phone)) map.set(phone, []);
    map.get(phone)!.push(m);
  });
  return Array.from(map.entries()).map(([phone, messages]) => {
    messages.sort((a, b) => a.sent_at.localeCompare(b.sent_at));
    const intents = [...new Set(messages.filter(m => m.intent).map(m => m.intent!))];
    return {
      phone,
      messages,
      lastAt: messages[messages.length - 1].sent_at,
      hasInbound: messages.some(m => m.direction === 'inbound'),
      intents,
    };
  }).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

const intentTag = (i: string) => {
  switch (i) {
    case 'emergency': return 'bg-[hsl(var(--destructive)/0.08)] text-destructive border-destructive/20';
    case 'quote': return 'bg-sky-dim text-sky border-blue-2';
    case 'appointment': return 'bg-success-bg text-success border-success';
    default: return 'bg-ember-dim text-ember border-ember';
  }
};
const intentLabel = (i: string) => {
  switch (i) {
    case 'emergency': return '🚨 EMERGENCY';
    case 'quote': return '💬 QUOTE';
    case 'appointment': return '✓ APPT';
    default: return i.toUpperCase();
  }
};

export function InboxTab({ client }: { client: Client }) {
  const { smsLog, optOuts, reviewsSent, replyTexts, setReplyText, sendReply, markDone, stopSequence, setConfirmDel } = useAppStore();
  const convos = getConversations(smsLog);

  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-xs font-mono text-t3">{convos.length} conversation{convos.length !== 1 ? 's' : ''}</div>
        <button className="bg-[hsl(var(--destructive)/0.08)] text-destructive border border-destructive/20 rounded-[7px] py-1.5 px-3 cursor-pointer text-[11px] font-mono flex items-center gap-1 hover:bg-[hsl(var(--destructive)/0.15)] transition-all" onClick={() => setConfirmDel({ type: 'inbox', id: 'all', label: 'all conversations' })}>
          🗑 Clear All Conversations
        </button>
      </div>

      {convos.length === 0 ? (
        <div className="text-center py-14 bg-s1 border border-dashed border-blue-2 rounded-xl">
          <div className="text-3xl mb-3 opacity-50">💬</div>
          <div className="text-[13px] text-t3 font-mono">No conversations yet. Replies appear here automatically.</div>
        </div>
      ) : (
        convos.map(cv => {
          const isOptOut = optOuts.includes(cv.phone);
          const revSent = reviewsSent[cv.phone];
          const rt = replyTexts[cv.phone] || '';

          return (
            <div key={cv.phone} className={`bg-s1 border rounded-xl p-4 mb-3 transition-colors animate-fade-up ${cv.hasInbound ? 'border-ember' : revSent ? 'border-gold' : 'border-blue'}`}>
              <div className="flex justify-between items-start mb-3.5">
                <div>
                  <div className="font-mono text-sm font-medium text-foreground">{cv.phone}</div>
                  <div className="text-[10px] font-mono text-t3 mt-0.5">{formatDate(cv.lastAt)} · {cv.messages.length} messages</div>
                </div>
                <div className="flex gap-1.5 items-start">
                  {cv.intents.map(i => (
                    <span key={i} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${intentTag(i)}`}>{intentLabel(i)}</span>
                  ))}
                  <button className="bg-[hsl(var(--destructive)/0.08)] text-destructive border border-destructive/20 rounded-[7px] py-1 px-2.5 cursor-pointer text-[11px] font-mono hover:bg-[hsl(var(--destructive)/0.15)] transition-all" onClick={() => setConfirmDel({ type: 'convo', id: cv.phone, label: `conversation with ${cv.phone}` })}>
                    🗑
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-3">
                {cv.messages.slice(-5).map(m => (
                  <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div>
                      <div className={`max-w-[78%] px-3 py-2 text-xs leading-relaxed ${
                        m.direction === 'outbound'
                          ? m.step === 'review'
                            ? 'bg-gold-bg border border-gold rounded-xl rounded-br-sm text-gold'
                            : 'gradient-sky text-primary-foreground rounded-xl rounded-br-sm'
                          : 'bg-s2 text-foreground border border-blue rounded-xl rounded-bl-sm'
                      }`}>
                        {m.body}
                      </div>
                      <div className="text-[9px] font-mono text-t3 mt-0.5 text-right">
                        {formatTime(m.sent_at)}
                        {m.step === 'ai' && ' · ✦ AI'}
                        {m.step === 'manual' && ' · Manual'}
                        {m.step === 'review' && ' · ⭐ Review Request'}
                        {typeof m.step === 'number' && ` · Step ${m.step}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {revSent && (
                <div className="bg-gold-bg border border-gold rounded-lg px-3 py-2 mt-2 text-xs text-gold flex items-center gap-2" style={{ animation: 'reviewPop 0.4s ease' }}>
                  ⭐ Review Request Sent
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
                      className="flex-1 bg-3 border border-blue rounded-lg text-foreground font-body text-xs px-3 py-2 outline-none focus:border-primary transition-colors"
                      placeholder={`Reply as ${client.name}...`}
                      value={rt}
                      onChange={e => setReplyText(cv.phone, e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendReply(cv.phone, rt)}
                    />
                    <button className="gradient-sky text-primary-foreground border-none rounded-lg px-4 cursor-pointer font-display font-bold text-xs tracking-[.06em] hover:glow-sky transition-all active:scale-[0.95]" onClick={() => sendReply(cv.phone, rt)}>
                      SEND
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    <button className="text-[11px] font-mono py-1 px-2.5 rounded-md cursor-pointer border border-blue bg-transparent text-t2 hover:border-gold hover:text-gold hover:bg-gold-bg transition-all flex items-center gap-1" onClick={() => markDone(cv.phone)}>
                      ⭐ Mark Complete → Send Review Request
                    </button>
                    <button className="text-[11px] font-mono py-1 px-2.5 rounded-md cursor-pointer border border-blue bg-transparent text-t2 hover:border-ember hover:text-ember hover:bg-ember-dim transition-all flex items-center gap-1" onClick={() => stopSequence(cv.phone)}>
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
