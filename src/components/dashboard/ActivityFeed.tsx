import React from 'react'
import { useActivity } from '../../hooks/useActivity'
import { useAppStore } from '../../stores/app'
import { supabase, isDemoMode, demoHelpers } from '../../lib/supabase'
import type { Client, CallLog, SMSMessage } from '../../types'
import { buildWebhookURL } from '../../constants/brand'

interface Props { client: Client }

export function ActivityFeed({ client }: Props) {
  const { callLogs, smsLog, loading, deleteLog, clearAll } = useActivity(client.id)
  const { vmailOpen, toggleVmail, setShowConfirmDelete } = useAppStore()

  // Merge and sort
  const merged = [
    ...callLogs.map(c => ({ ...c, _type: 'call' as const, _ts: c.received_at })),
    ...smsLog.filter(s => s.direction === 'outbound').map(s => ({ ...s, _type: 'sms' as const, _ts: s.sent_at })),
  ].sort((a, b) => b._ts.localeCompare(a._ts))

  const simCall = async () => {
    const nums = ['+17865550381', '+13055550492', '+17865550571', '+13055550634']
    const from = nums[Math.floor(Math.random() * nums.length)]
    const hasVmail = Math.random() > 0.45
    const transcripts = [
      "Hi, I have a pretty bad leak under my kitchen sink — water's been dripping since this morning. Can someone come today?",
      "Hey, this is urgent — my AC stopped working completely. It's really hot in here. Please call me back ASAP.",
      "I'm calling about getting a quote for a bathroom remodel. I've got two bathrooms that need new pipes.",
      "Hi, calling about routine maintenance. Please give me a call back when you have a chance.",
    ]

    // Insert a demo call log directly
    await supabase.from('call_logs').insert({
      client_id: client.id,
      caller_number: from,
      call_status: 'no-answer',
      voicemail_url: hasVmail ? 'https://demo.voicemail/sim' : null,
      voicemail_transcript: hasVmail ? transcripts[Math.floor(Math.random() * transcripts.length)] : null,
    })

    // Simulate SMS after delay
    const smsBody = client.sms_template
      .replace(/{business_name}/g, client.name)
      .replace(/{caller_number}/g, from)
      .replace(/{time}/g, new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
      .replace(/{booking_link}/g, client.booking_link || 'https://cal.com/yourbiz')

    setTimeout(async () => {
      await supabase.from('sms_log').insert({
        client_id: client.id,
        direction: 'outbound',
        from_number: client.twilio_phone_number,
        to_number: from,
        body: smsBody,
        status: 'sent',
        sequence_step: '1',
      })
    }, (client.send_delay_seconds || 5) * 300)
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const stepLabel = (step: string | null) => {
    if (!step) return ''
    const m: Record<string, string> = {
      '1': 'Step 1 · Initial', '2': 'Step 2 · Follow-up',
      '3': 'Step 3 · Final', ai: '✦ AI Reply',
      manual: 'Manual Reply', review: 'Review Request',
    }
    return m[step] || step
  }

  const stepColor = (step: string | null) => {
    if (step === 'review') return 'var(--gold)'
    if (step === 'ai') return 'var(--purple)'
    return 'var(--blue)'
  }

  const iconCls = (item: typeof merged[0]) => {
    if (item._type === 'call') return { bg: 'var(--errbg)', border: 'var(--errb)', icon: '📵' }
    const step = (item as any).sequence_step
    if (step === 'review') return { bg: 'rgba(240,200,48,.08)', border: 'rgba(240,200,48,.22)', icon: '⭐' }
    if (step === 'ai') return { bg: 'rgba(155,92,246,.08)', border: 'rgba(155,92,246,.22)', icon: '🤖' }
    if (step === '2' || step === '3') return { bg: 'var(--bluedim)', border: 'var(--b2)', icon: '🔄' }
    return { bg: 'var(--okbg)', border: 'var(--okb)', icon: '💬' }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16" style={{ color: '#4a6080', fontFamily: "'JetBrains Mono'", fontSize: 12 }}>
      Loading activity...
    </div>
  )

  return (
    <div>
      {/* Sim bar */}
      <div className="flex items-center justify-between rounded-xl mb-4" style={{ background: 'linear-gradient(135deg, var(--s1), var(--s2))', border: '1px solid var(--bem)', padding: '12px 18px' }}>
        <span style={{ fontSize: 12, color: '#8fa3be', fontFamily: "'JetBrains Mono'", display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="inline-block rounded-full animate-pulse-dot" style={{ width: 8, height: 8, background: 'var(--ember)' }} />
          Test your deployment — simulate a live missed call
        </span>
        <div className="flex gap-2">
          <button
            className="sf-btn-danger"
            onClick={() => setShowConfirmDelete({ type: 'activity-all', id: client.id, label: 'all activity' })}
          >
            🗑 Clear All
          </button>
          <button className="sf-btn-ember" style={{ padding: '8px 18px', fontSize: 12 }} onClick={simCall}>
            ⚡ SIMULATE
          </button>
        </div>
      </div>

      {/* Webhook URL hint (first-run) */}
      {callLogs.length === 0 && smsLog.length === 0 && (
        <div className="sf-alert sf-alert-tip mb-4">
          <strong>No live calls yet.</strong> Paste this URL into Twilio → Phone Numbers → Voice URL to go live:{' '}
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--blue)' }}>
            {buildWebhookURL(client.id, 'missed-call')}
          </span>
        </div>
      )}

      {/* Feed */}
      {merged.length === 0 ? (
        <div className="empty flex flex-col items-center justify-center py-16" style={{ background: 'var(--s1)', border: '1px dashed var(--b2)', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: .5 }}>📡</div>
          <div style={{ fontSize: 13, color: '#4a6080', fontFamily: "'JetBrains Mono'" }}>Simulating will show calls here in real-time</div>
        </div>
      ) : (
        merged.map(item => {
          const { bg, border, icon } = iconCls(item)
          const isSms = item._type === 'sms'
          const step = isSms ? (item as any).sequence_step : null
          const sl = stepLabel(step)
          const isCall = item._type === 'call'
          const hasVmail = isCall && (item as any).voicemail_transcript
          const vid = `vm-${item.id}`

          return (
            <div
              key={item.id}
              className="rounded-xl mb-2 transition-all duration-150 hover:border-opacity-60"
              style={{ background: 'var(--s1)', border: `1px solid var(--b1)`, padding: '12px 16px', display: 'grid', gridTemplateColumns: '38px 1fr auto', gap: 12, alignItems: 'start' }}
            >
              {/* Icon */}
              <div className="flex items-center justify-center flex-shrink-0 rounded-lg" style={{ width: 38, height: 38, background: bg, border: `1px solid ${border}`, fontSize: 17, marginTop: 2 }}>
                {icon}
              </div>

              {/* Content */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 500, color: '#e8edf5', marginBottom: 3 }}>
                  {isSms ? (item as any).to_number : (item as any).caller_number}
                </div>
                <div style={{ fontSize: 11, color: '#8fa3be', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isSms ? (
                    <>
                      {sl && <span style={{ color: stepColor(step), fontWeight: 600 }}>[{sl}]</span>}{' '}
                      {(item as any).body}
                    </>
                  ) : (
                    `Missed call (${(item as any).call_status}) · 3-touch sequence triggered`
                  )}
                </div>

                {/* Voicemail transcript card */}
                {hasVmail && (
                  <div className="sf-vmail-card">
                    <div className="sf-vmail-header" onClick={() => toggleVmail(vid)}>
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono'", color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        🎙 Voicemail Transcript · Whisper AI
                      </span>
                      <span style={{ fontSize: 10, color: '#4a6080', marginLeft: 'auto', marginRight: 6 }}>~0:{Math.floor(Math.random() * 20 + 10)}</span>
                      <span style={{ fontSize: 10, color: '#4a6080', transition: 'transform .2s', transform: vmailOpen[vid] ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                    </div>
                    {vmailOpen[vid] && (
                      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(155,92,246,.2)', fontSize: 12, color: '#8fa3be', lineHeight: 1.7 }}>
                        <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono'", color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Transcript</div>
                        <div style={{ fontStyle: 'italic', color: '#e8edf5', borderLeft: '2px solid var(--purple)', paddingLeft: 10 }}>
                          {(item as any).voicemail_transcript}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: time + badge + delete */}
              <div className="flex flex-col items-end gap-1.5">
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: '#4a6080', whiteSpace: 'nowrap' }}>
                  {fmtTime(item._ts)}
                </div>
                {isSms
                  ? <span className={`sf-badge ${step === 'review' ? 'sf-badge-gold' : step === 'ai' ? 'sf-badge-purple' : 'sf-badge-ok'}`}>
                      {step === 'review' ? 'REVIEW' : step === 'ai' ? 'AI' : 'SENT'}
                    </span>
                  : <span className="sf-badge sf-badge-err">MISSED</span>
                }
                <button
                  className="sf-btn-danger"
                  style={{ padding: '3px 8px', fontSize: 10 }}
                  onClick={() => setShowConfirmDelete({
                    type: isSms ? 'sms' : 'call',
                    id: item.id,
                    label: 'this entry',
                  })}
                >
                  🗑
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
