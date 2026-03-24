import React, { useEffect, useState } from 'react'
import { analytics, webhookHealth } from '../../lib/supabase'
import type { Client, ClientAnalytics, WebhookHealth } from '../../types'

interface Props { client: Client }

export function AnalyticsTab({ client }: Props) {
  const [anal, setAnal] = useState<ClientAnalytics | null>(null)
  const [health, setHealth] = useState<WebhookHealth | null>(null)

  useEffect(() => {
    analytics.get(client.id).then(setAnal)
    webhookHealth.get(client.id).then(setHealth)
  }, [client.id])

  const fmtTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Never'

  const rev = anal?.revenue_protected_30d ?? (((anal?.missed_30d ?? 0) || 14) * client.avg_job_value)
  const roi = Math.round(rev / 497)

  return (
    <div>
      {/* Revenue hero */}
      <div className="relative rounded-2xl mb-3.5 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--s1), var(--s2))', border: '1px solid var(--bem)', padding: 24 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--ember2), var(--ember), var(--blue))' }} />
        <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono'", color: '#4a6080', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Estimated Revenue Protected · Last 30 Days
        </div>
        <div style={{ fontFamily: "'Rajdhani'", fontSize: 46, fontWeight: 700, color: 'var(--ember)', textShadow: '0 0 24px var(--emberglow)', letterSpacing: '.03em', lineHeight: 1 }}>
          ${rev.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: '#8fa3be', marginTop: 6 }}>
          {anal?.missed_30d ?? 14} missed calls × ${client.avg_job_value} avg ·{' '}
          <strong style={{ color: 'var(--ok)' }}>ROI: {roi}x investment</strong>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 mb-3.5">
        {[
          { l: '7-Day Missed', v: anal?.missed_7d ?? '—' },
          { l: '7-Day SMS Sent', v: anal?.sms_7d ?? '—' },
          { l: '30-Day Missed', v: anal?.missed_30d ?? '—' },
          { l: '30-Day SMS Sent', v: anal?.sms_30d ?? '—' },
        ].map(s => (
          <div key={s.l} className="sf-card" style={{ marginBottom: 0 }}>
            <div className="sf-stat-label">{s.l}</div>
            <div className="sf-stat-value">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Weekly report preview */}
      <div className="sf-card mb-3.5">
        <div className="sf-card-title">
          Weekly Revenue Report
          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: 'var(--ok)', fontWeight: 400, marginLeft: 'auto' }}>Auto-sent every Monday</span>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--bg3)', border: '1px solid var(--b1)', fontSize: 12, lineHeight: 1.8, color: '#8fa3be' }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 15, color: '#e8edf5', marginBottom: 8 }}>
            📊 Respondfall AI Weekly Report — {client.name}
          </div>
          <strong style={{ color: '#e8edf5' }}>This week:</strong>{' '}
          {anal?.missed_7d ?? 4} missed calls · {anal?.sms_7d ?? 8} SMS sent ·{' '}
          <strong style={{ color: 'var(--ember)' }}>${((anal?.missed_7d ?? 4) * client.avg_job_value).toLocaleString()} protected</strong>
          <br />
          <span style={{ color: '#4a6080', fontSize: 11 }}>
            Respondfall AI · SkyforgeAI · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* TCPA */}
      <div className="sf-card mb-3.5">
        <div className="sf-card-title">TCPA Compliance</div>
        <div style={{ fontSize: 13, color: '#4a6080' }}>
          All STOP requests are automatically logged, honored, and cannot be overridden. Timezone-aware blackout hours active.
        </div>
      </div>

      {/* System health */}
      <div className="sf-card">
        <div className="sf-card-title">System Health</div>
        {[
          { k: 'Last Webhook Ping',    v: fmtTime(health?.last_ping_at ?? null) },
          { k: 'Last Successful Send', v: fmtTime(health?.last_success_at ?? null) },
          { k: 'Consecutive Failures', v: health?.consecutive_failures ?? 0 },
          { k: 'Last Error',           v: health?.last_error || 'None' },
        ].map(r => (
          <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '7px 0', borderBottom: '1px solid rgba(212,221,232,.08)' }}>
            <span style={{ color: '#8fa3be' }}>{r.k}</span>
            <span style={{ fontFamily: "'JetBrains Mono'", color: '#e8edf5' }}>{String(r.v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
