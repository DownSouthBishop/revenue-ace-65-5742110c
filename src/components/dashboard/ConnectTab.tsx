import React from 'react'
import { useAppStore } from '../../stores/app'
import { CARRIERS, PHONE_SOURCES } from '../../constants/brand'
import { buildWebhookURL } from '../../constants/brand'
import type { Client } from '../../types'

interface Props { client: Client }

export function ConnectTab({ client }: Props) {
  const { connectSource, setConnectSource, connectCarrier, setConnectCarrier } = useAppStore()
  const car = CARRIERS.find(c => c.id === connectCarrier) || CARRIERS[0]

  const copyText = (t: string, btn: HTMLElement) => {
    navigator.clipboard.writeText(t).catch(() => {})
    const orig = btn.textContent
    btn.textContent = '✓ Copied'
    setTimeout(() => { btn.textContent = orig }, 2000)
  }

  return (
    <div>
      {/* Your number */}
      <div className="sf-card mb-3.5">
        <div className="sf-card-title">Your Respondfall Number</div>
        <div className="flex items-center justify-between rounded-xl"
          style={{ background: 'var(--bg3)', border: '1px solid var(--okb)', padding: '14px 18px' }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 600, color: 'var(--ok)' }}>
              {client.twilio_phone_number}
            </div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: '#4a6080', marginTop: 3 }}>
              SkyforgeAI Infrastructure · Managed for you · Included in your plan
            </div>
          </div>
          <button
            className="sf-url-copy"
            style={{ padding: '8px 14px' }}
            onClick={e => copyText(client.twilio_phone_number, e.currentTarget)}
          >
            Copy Number
          </button>
        </div>
      </div>

      {/* Webhook endpoints */}
      <div className="sf-card mb-3.5">
        <div className="sf-card-title">Webhook Endpoints</div>
        <div className="sf-alert sf-alert-tip mb-3.5">
          These URLs are pre-configured on your SkyforgeAI number. If you're using a custom Twilio account, paste them into your Twilio Console.
        </div>
        {([
          { l: 'Missed Call Webhook (Voice → Status Callback)', t: 'missed-call' as const },
          { l: 'Inbound SMS Webhook (Messaging URL)', t: 'inbound-sms' as const },
        ] as const).map(u => (
          <div key={u.t} style={{ marginBottom: 14 }}>
            <label className="sf-label">{u.l}</label>
            <div className="sf-url-row">
              <div className="sf-url-val">{buildWebhookURL(client.id, u.t)}</div>
              <button
                className="sf-url-copy"
                onClick={e => copyText(buildWebhookURL(client.id, u.t), e.currentTarget)}
              >
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Forwarding guide */}
      <div className="sf-card">
        <div className="sf-card-title">Conditional Call Forwarding Setup</div>
        <div className="sf-alert sf-alert-tip mb-4">
          Client keeps their existing number. <strong>Only missed/unanswered calls forward</strong> to your Respondfall number — calls they answer go through normally. Zero disruption.
        </div>

        {/* Source selector */}
        <label className="sf-label">Client's Phone Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
          {PHONE_SOURCES.map(src => (
            <div
              key={src.id}
              onClick={() => setConnectSource(src.id)}
              style={{
                border: connectSource === src.id ? '2px solid var(--blue)' : '1px solid var(--b1)',
                borderRadius: 10, padding: '14px 10px', cursor: 'pointer', textAlign: 'center',
                background: connectSource === src.id ? 'var(--bluedim)' : 'var(--s1)',
                boxShadow: connectSource === src.id ? '0 0 12px var(--blueglow)' : 'none',
                transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 7 }}>{src.icon}</div>
              <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: connectSource === src.id ? 'var(--blue)' : '#8fa3be', letterSpacing: '.06em' }}>
                {src.label}
              </div>
            </div>
          ))}
        </div>

        {/* iPhone / Android → carrier sub-tabs + USSD code */}
        {(connectSource === 'iphone' || connectSource === 'android') && (
          <>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
              {CARRIERS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setConnectCarrier(c.id)}
                  style={{
                    padding: '5px 13px', borderRadius: 6,
                    border: connectCarrier === c.id ? '1px solid var(--blue)' : '1px solid var(--b1)',
                    background: connectCarrier === c.id ? 'var(--bluedim)' : 'transparent',
                    color: connectCarrier === c.id ? 'var(--blue)' : '#4a6080',
                    fontSize: 11, fontFamily: "'JetBrains Mono'", cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <label className="sf-label">
              Dial from Phone app · Replace XXXXXXXXXX with digits of {client.twilio_phone_number}
            </label>
            <div
              style={{
                background: 'var(--bg)', border: '1px solid var(--b2)', borderRadius: 8,
                padding: '10px 14px', fontFamily: "'JetBrains Mono'", fontSize: 14, color: 'var(--blue)',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 12, margin: '8px 0', transition: 'all .15s',
              }}
              onClick={e => copyText(car.code, e.currentTarget)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px var(--bluedim)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--b2)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              <span>{car.code}</span>
              <span style={{ fontSize: 10, color: '#4a6080' }}>tap to copy</span>
            </div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: '#4a6080', marginTop: 8 }}>
              To disable: <strong>{car.disable}</strong>
            </div>
          </>
        )}

        {connectSource === 'google' && (
          <div style={{ fontSize: 13, color: '#8fa3be', lineHeight: 1.8 }}>
            <strong style={{ color: '#e8edf5' }}>voice.google.com</strong> → Settings → Calls → Call Forwarding
            → Add <code style={{ color: 'var(--blue)', fontFamily: "'JetBrains Mono'" }}>{client.twilio_phone_number}</code>
            → Set ring time to 20 seconds before forwarding.
          </div>
        )}

        {connectSource === 'landline' && (
          <div style={{ fontSize: 13, color: '#8fa3be', lineHeight: 1.8 }}>
            Pick up handset → dial{' '}
            <code style={{ color: 'var(--blue)', fontFamily: "'JetBrains Mono'" }}>
              *92 {client.twilio_phone_number}
            </code>{' '}
            → 2 confirmation beeps = forwarding active.
            <br />For VoIP: provider portal → Call Settings → Forward when no answer → enter your Respondfall number.
          </div>
        )}

        {connectSource === 'ringcentral' && (
          <div style={{ fontSize: 13, color: '#8fa3be', lineHeight: 1.8 }}>
            <strong style={{ color: '#e8edf5' }}>app.ringcentral.com</strong> → Admin Portal → Phone System
            → Users → Call Handling & Forwarding → "If no one answers"
            → Forward to external number → enter{' '}
            <code style={{ color: 'var(--blue)', fontFamily: "'JetBrains Mono'" }}>{client.twilio_phone_number}</code>
            → 20 second timeout.
          </div>
        )}

        {connectSource === 'openphone' && (
          <div style={{ fontSize: 13, color: '#8fa3be', lineHeight: 1.8 }}>
            OpenPhone Settings → your number → Call Forwarding → "When unavailable"
            → enter{' '}
            <code style={{ color: 'var(--blue)', fontFamily: "'JetBrains Mono'" }}>{client.twilio_phone_number}</code>.
            <br />Alternatively, OpenPhone's built-in auto-reply for missed calls can supplement Respondfall.
          </div>
        )}
      </div>
    </div>
  )
}
