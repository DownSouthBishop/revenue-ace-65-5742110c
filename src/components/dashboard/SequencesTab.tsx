import React from 'react'
import type { Client } from '../../types'

interface Props { client: Client }

export function SequencesTab({ client }: Props) {
  return (
    <div>
      {/* 3-touch sequence */}
      <div className="sf-card mb-3.5">
        <div className="sf-card-title">3-Touch Recovery Sequence</div>
        <div className="sf-alert sf-alert-tip mb-4">
          <strong>Auto-fires for every missed call.</strong> Stops the moment they reply or book. Converts 30–40% of missed calls into booked appointments.
        </div>
        <Step num="s1" delay={`Fires immediately (+${client.send_delay_seconds}s delay)`}
          msg={`"${client.sms_template.replace(/{booking_link}/g, client.booking_link || '[booking link]').replace(/{business_name}/g, client.name)}"`} />
        <Connector />
        <Step num="s2" delay="2 hours later — if no reply"
          msg={`"Hey, still hoping to connect — ${client.name} has availability this week. Book anytime: ${client.booking_link || '[booking link]'}."`} />
        <Connector />
        <Step num="s3" delay="24 hours later — final touchpoint"
          msg={`"Last check-in from ${client.name} — we'd love to help. Book when ready: ${client.booking_link || '[link]'}. Reply STOP to unsubscribe."`} />
      </div>

      {/* Review request */}
      <div className="sf-card mb-3.5" style={{ borderColor: client.google_review_link ? 'var(--b1)' : 'var(--bem)' }}>
        <div className="sf-card-title">Post-Job Review Request</div>
        {client.google_review_link ? (
          <>
            <div className="sf-alert sf-alert-ember mb-4">
              <strong>The flywheel is live:</strong> Mark a job complete in Inbox → this fires 2 hours later → more 5-star reviews → higher Google ranking → more inbound calls → more revenue to protect.
            </div>
            <Step num="sr" delay={`Fires 2 hours after "Mark Job Complete"`}
              msg={`"Thanks for choosing ${client.name}! If we did a great job today, a quick Google review means the world to us: ${client.google_review_link} — only takes 30 seconds!"`}
              gold />
            <div className="sf-alert sf-alert-ok mt-3.5 mb-0">
              Go to <strong>Inbox</strong> → tap "Mark Complete → Send Review" on any conversation to trigger this.
            </div>
          </>
        ) : (
          <div className="sf-alert sf-alert-warn mb-0">
            Google Review Link is not set. Add it in <strong>Settings → Revenue Multipliers</strong> to unlock post-job review requests — this is the single highest-ROI feature.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="sf-card">
        <div className="sf-card-title">Sequence Performance</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: 'Active Sequences', v: '—', c: 'var(--blue)' },
            { l: 'Step 2 Trigger Rate', v: '—', c: '#e8edf5' },
            { l: 'Conversion Rate', v: '—', c: 'var(--ok)' },
          ].map(s => (
            <div key={s.l} className="rounded-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--b1)', padding: 14 }}>
              <div className="sf-stat-label">{s.l}</div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 26, fontWeight: 700, color: s.c }}>{s.v}</div>
              <div className="sf-stat-sub">Live data when active</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step({ num, delay, msg, gold = false }: { num: string; delay: string; msg: string; gold?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 14, marginBottom: 14, alignItems: 'start' }}>
      <div className={`sf-seq-num ${num}`}>{num === 'sr' ? '⭐' : num.replace('s', '')}</div>
      <div className="rounded-lg" style={{ background: 'var(--bg3)', border: '1px solid var(--b1)', padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: 'var(--ember)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          ⏱ {delay}
        </div>
        <div style={{ fontSize: 12, color: gold ? 'var(--gold)' : '#8fa3be', lineHeight: 1.6 }}>{msg}</div>
      </div>
    </div>
  )
}

function Connector() {
  return <div style={{ width: 2, height: 14, background: 'linear-gradient(180deg, var(--blue), var(--ember))', margin: '0 0 14px 13px', opacity: .4 }} />
}
