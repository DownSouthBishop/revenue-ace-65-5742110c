import React, { useState } from 'react'
import { useActivity } from '../../hooks/useActivity'
import { useAppStore } from '../../stores/app'
import { supabase, isDemoMode, demoHelpers } from '../../lib/supabase'
import { INTENT_CONFIG } from '../../constants/brand'
import type { Client, SMSMessage } from '../../types'

interface Props { client: Client }

export function Inbox({ client }: Props) {
  const { smsLog, loading } = useActivity(client.id)
  const { replyTexts, setReplyText, reviewsSent, markReviewSent, setShowConfirmDelete, setActiveTab } = useAppStore()
  const [sending, setSending] = useState<string | null>(null)
  const [markingDone, setMarkingDone] = useState<string | null>(null)

  // Group messages into conversations by phone number
  const threads: Record<string, SMSMessage[]> = {}
  smsLog.forEach(m => {
    const phone = m.direction === 'inbound' ? m.from_number : m.to_number
    if (!threads[phone]) threads[phone] = []
    threads[phone].push(m)
  })
  const convos = Object.entries(threads)
    .map(([phone, messages]) => ({
      phone,
      messages: messages.sort((a, b) => a.sent_at.localeCompare(b.sent_at)),
      hasInbound: messages.some(m => m.direction === 'inbound'),
      intents: [...new Set(messages.filter(m => m.intent).map(m => m.intent!))],
      lastAt: messages[messages.length - 1]?.sent_at || '',
    }))
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt))

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const sendReply = async (phone: string) => {
    const text = replyTexts[phone]?.trim()
    if (!text) return
    setSending(phone)
    await supabase.from('sms_log').insert({
      client_id: client.id,
      direction: 'outbound',
      from_number: client.twilio_phone_number,
      to_number: phone,
      body: text,
      status: 'sent',
      sequence_step: 'manual',
    })
    // Also fire real Twilio SMS via Edge Function
    await supabase.functions.invoke('send-manual-sms', {
      body: { clientId: client.id, toNumber: phone, body: text },
    }).catch(() => {}) // don't block UI if function not deployed yet
    setReplyText(phone, '')
    setSending(null)
  }

  const markComplete = async (phone: string) => {
    if (!client.google_review_link) {
      // Guide user to settings
      setActiveTab('config')
      return
    }
    setMarkingDone(phone)
    const msg = `Thanks for choosing ${client.name}! If we did a great job today, a quick Google review means the world to us: ${client.google_review_link}`
    await supabase.from('sms_log').insert({
      client_id: client.id,
      direction: 'outbound',
      from_number: client.twilio_phone_number,
      to_number: phone,
      body: msg,
      status: 'sent',
      sequence_step: 'review',
    })
    // Invoke review-request Edge Function for 2hr delayed follow-up
    await supabase.functions.invoke('review-request', {
      body: { clientId: client.id, phoneNumber: phone },
    }).catch(() => {})
    markReviewSent(phone)
    setMarkingDone(null)
  }

  const stopSequence = async (phone: string) => {
    await supabase.from('sequence_runs')
      .update({ status: 'stopped', stopped_reason: 'manual' })
      .eq('client_id', client.id)
      .eq('caller_number', phone)
      .eq('status', 'running')
  }

  const bubbleClass = (m: SMSMessage) => {
    if (m.direction === 'inbound') return 'sf-bubble-in'
    if (m.sequence_step === 'review') return 'sf-bubble-review'
    return 'sf-bubble-out'
  }

  const stepLabel = (step: string | null) => {
    if (!step) return ''
    return { '1': 'Step 1', '2': 'Step 2', '3': 'Step 3', ai: '✦ AI', manual: 'Manual', review: '⭐ Review' }[step] || step
  }

  if (loading) return (
    <div style={{ color: '#4a6080', fontFamily: "'JetBrains Mono'", fontSize: 12, padding: 16 }}>Loading conversations...</div>
  )

  return (
    <div>
      {/* Header with clear all */}
      <div className="flex items-center justify-between mb-3.5">
        <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono'", color: '#4a6080' }}>
          {convos.length} conversation{convos.length !== 1 ? 's' : ''}
        </div>
        <button
          className="sf-btn-danger"
          onClick={() => setShowConfirmDelete({ type: 'inbox-all', id: client.id, label: 'all conversations' })}
        >
          🗑 Clear All
        </button>
      </div>

      {!convos.length ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl" style={{ background: 'var(--s1)', border: '1px dashed var(--b2)' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: .5 }}>💬</div>
          <div style={{ fontSize: 13, color: '#4a6080', fontFamily: "'JetBrains Mono'" }}>Replies appear here when someone responds to your SMS</div>
        </div>
      ) : (
        convos.map(conv => {
          const isOptedOut = false // loaded from opt_outs table in production
          const revSent = reviewsSent[conv.phone]

          return (
            <div
              key={conv.phone}
              className="rounded-xl mb-3 transition-all duration-150"
              style={{
                background: 'var(--s1)',
                border: `1px solid ${revSent ? 'rgba(240,200,48,.3)' : conv.hasInbound ? 'var(--bem)' : 'var(--b1)'}`,
                padding: 16,
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3.5">
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 500, color: '#e8edf5' }}>{conv.phone}</div>
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: '#4a6080', marginTop: 2 }}>
                    {new Date(conv.lastAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {conv.messages.length} messages
                  </div>
                </div>
                <div className="flex gap-1.5 items-start">
                  {conv.intents.map(intent => {
                    const cfg = INTENT_CONFIG[intent]
                    return cfg ? (
                      <span key={intent} style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", padding: '2px 8px', borderRadius: 4, ...getCfgStyle(intent) }}>
                        {cfg.label}
                      </span>
                    ) : null
                  })}
                  <button
                    className="sf-btn-danger"
                    style={{ marginLeft: 4 }}
                    onClick={() => setShowConfirmDelete({ type: 'convo', id: conv.phone, label: `conversation with ${conv.phone}` })}
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Bubbles */}
              <div className="flex flex-col gap-1.5 mb-3">
                {conv.messages.slice(-5).map(m => (
                  <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div>
                      <div className={bubbleClass(m)}>{m.body}</div>
                      <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono'", color: '#4a6080', marginTop: 3, textAlign: 'right' }}>
                        {fmtTime(m.sent_at)}
                        {m.sequence_step ? ` · ${stepLabel(String(m.sequence_step))}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review banner */}
              {revSent && (
                <div className="flex items-center gap-2 rounded-lg mb-2 animate-review-pop" style={{ background: 'rgba(240,200,48,.08)', border: '1px solid rgba(240,200,48,.22)', padding: '8px 12px', fontSize: 12, color: 'var(--gold)' }}>
                  ⭐ Review request sent — 2hr follow-up scheduled
                </div>
              )}

              {/* Opted out */}
              {isOptedOut ? (
                <div style={{ textAlign: 'center', fontSize: 11, fontFamily: "'JetBrains Mono'", color: 'var(--err)', background: 'var(--errbg)', border: '1px solid var(--errb)', borderRadius: 6, padding: 7 }}>
                  OPTED OUT · STOP received · TCPA Compliant
                </div>
              ) : (
                <>
                  {/* Reply input */}
                  <div className="flex gap-2">
                    <input
                      className="sf-input flex-1"
                      style={{ fontSize: 12, padding: '9px 12px' }}
                      placeholder={`Reply as ${client.name}...`}
                      value={replyTexts[conv.phone] || ''}
                      onChange={e => setReplyText(conv.phone, e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendReply(conv.phone)}
                    />
                    <button
                      onClick={() => sendReply(conv.phone)}
                      disabled={sending === conv.phone}
                      style={{
                        background: 'linear-gradient(135deg, var(--blue), var(--blue2))',
                        color: '#fff', border: 'none', borderRadius: 8, padding: '0 18px',
                        cursor: 'pointer', fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 12, letterSpacing: '.06em',
                      }}
                    >
                      {sending === conv.phone ? '...' : 'SEND'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    <button
                      onClick={() => markComplete(conv.phone)}
                      disabled={markingDone === conv.phone || revSent}
                      style={{
                        fontSize: 11, fontFamily: "'JetBrains Mono'", padding: '5px 10px', borderRadius: 6,
                        cursor: 'pointer', background: 'transparent',
                        border: '1px solid var(--b1)', color: '#8fa3be',
                        transition: 'all .15s',
                        opacity: revSent ? .5 : 1,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--b1)'; (e.currentTarget as HTMLElement).style.color = '#8fa3be' }}
                    >
                      {markingDone === conv.phone ? '...' : revSent ? '✓ Review Sent' : '⭐ Mark Complete → Send Review'}
                    </button>
                    <button
                      onClick={() => stopSequence(conv.phone)}
                      style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", padding: '5px 10px', borderRadius: 6, cursor: 'pointer', background: 'transparent', border: '1px solid var(--b1)', color: '#8fa3be', transition: 'all .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ember)'; (e.currentTarget as HTMLElement).style.color = 'var(--ember)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--b1)'; (e.currentTarget as HTMLElement).style.color = '#8fa3be' }}
                    >
                      ⏹ Stop Sequence
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function getCfgStyle(intent: string) {
  const styles: Record<string, React.CSSProperties> = {
    emergency:   { background: 'var(--errbg)', color: 'var(--err)', border: '1px solid var(--errb)' },
    quote:       { background: 'var(--bluedim)', color: 'var(--blue)', border: '1px solid var(--b2)' },
    appointment: { background: 'var(--okbg)', color: 'var(--ok)', border: '1px solid var(--okb)' },
    general:     { background: 'var(--emberdim)', color: 'var(--ember)', border: '1px solid var(--bem)' },
    info:        { background: 'var(--s2)', color: '#8fa3be', border: '1px solid var(--b1)' },
  }
  return styles[intent] || styles.info
}
