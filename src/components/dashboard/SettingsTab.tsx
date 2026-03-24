import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../stores/app'
import { PhonePicker } from '../phone/PhonePicker'
import { BUSINESS_TYPES, SMS_VARIABLES } from '../../constants/brand'
import type { Client, ClientUpdate } from '../../types'

interface Props {
  client: Client
  onUpdate: (id: string, updates: ClientUpdate) => Promise<Client>
}

export function SettingsTab({ client, onUpdate }: Props) {
  const { configSaved, setConfigSaved, setShowConfirmDelete } = useAppStore()
  const [form, setForm] = useState({ ...client })
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm({ ...client }) }, [client.id])

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    await onUpdate(client.id, {
      name: form.name,
      business_type: form.business_type,
      avg_job_value: Number(form.avg_job_value),
      sms_template: form.sms_template,
      send_delay_seconds: Number(form.send_delay_seconds),
      blackout_start: Number(form.blackout_start),
      blackout_end: Number(form.blackout_end),
      booking_link: form.booking_link || null,
      google_review_link: form.google_review_link || null,
    })
    setConfigSaved(true)
    setSaving(false)
    setTimeout(() => setConfigSaved(false), 3000)
  }

  const charCount = form.sms_template?.length || 0

  return (
    <div>
      {/* Business profile */}
      <div className="sf-card mb-3.5">
        <div className="sf-card-title">Business Profile</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }} className="flex flex-col gap-1.5">
            <label className="sf-label">Business Name</label>
            <input className="sf-input" value={form.name || ''} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="sf-label">Industry</label>
            <select className="sf-input" value={form.business_type} onChange={e => set('business_type', e.target.value as any)}>
              {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="sf-label">Avg Job Value ($)</label>
            <input className="sf-input" type="number" value={form.avg_job_value} onChange={e => set('avg_job_value', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Phone number */}
      <div className="sf-card mb-3.5">
        <div className="sf-card-title">Respondfall Phone Number</div>
        <div className="flex items-center justify-between rounded-xl mb-3.5" style={{ background: 'var(--bg3)', border: '1px solid var(--okb)', padding: '14px 18px' }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 600, color: 'var(--ok)' }}>
              {client.twilio_phone_number || 'No number provisioned'}
            </div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: '#4a6080', marginTop: 3 }}>
              SkyforgeAI Infrastructure · Managed for you
            </div>
          </div>
          <button onClick={() => navigator.clipboard.writeText(client.twilio_phone_number || '')}
            className="sf-url-copy" style={{ padding: '8px 14px' }}>Copy</button>
        </div>
        <div className="sf-alert sf-alert-tip">To change your number, search below and claim a replacement. Takes effect immediately.</div>
        <PhonePicker
          selectedNumber={client.twilio_phone_number}
          onSelect={n => set('twilio_phone_number', n.number)}
        />
      </div>

      {/* SMS config */}
      <div className="sf-card mb-3.5">
        <div className="sf-card-title">SMS Configuration</div>
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="sf-label" style={{ marginBottom: 0 }}>Initial SMS Template</label>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: charCount > 160 ? 'var(--err)' : '#4a6080' }}>
                {charCount}/160
              </span>
            </div>
            <textarea
              className="sf-input"
              style={{ minHeight: 80, lineHeight: 1.6 }}
              value={form.sms_template || ''}
              onChange={e => set('sms_template', e.target.value)}
            />
            <div className="flex gap-1.5 flex-wrap mt-1">
              {SMS_VARIABLES.map(v => (
                <span
                  key={v.label}
                  className="vchip"
                  style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", background: 'var(--bluedim)', color: 'var(--blue)', border: '1px solid var(--b2)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                  onClick={() => set('sms_template', (form.sms_template || '') + v.label)}
                >
                  {v.label}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="flex flex-col gap-1.5">
              <label className="sf-label">Send Delay (seconds)</label>
              <input className="sf-input" type="number" min="0" max="60" value={form.send_delay_seconds} onChange={e => set('send_delay_seconds', e.target.value)} />
            </div>
            <div />
            <div className="flex flex-col gap-1.5">
              <label className="sf-label">Blackout Start (0–23)</label>
              <input className="sf-input" type="number" min="0" max="23" value={form.blackout_start} onChange={e => set('blackout_start', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="sf-label">Blackout End (0–23)</label>
              <input className="sf-input" type="number" min="0" max="23" value={form.blackout_end} onChange={e => set('blackout_end', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue multipliers */}
      <div className="sf-card mb-3.5">
        <div className="sf-card-title">Revenue Multipliers</div>
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="sf-label">
              Booking Link{' '}
              <span style={{ color: 'var(--ember)' }}>★ Critical for conversion</span>
            </label>
            <input
              className="sf-input"
              placeholder="https://cal.com/yourbusiness or Calendly link"
              value={form.booking_link || ''}
              onChange={e => set('booking_link', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="sf-label">
              Google Review Link{' '}
              <span style={{ color: 'var(--gold)' }}>★ Enables post-job review requests</span>
            </label>
            <input
              className="sf-input"
              placeholder="https://g.page/r/.../review"
              value={form.google_review_link || ''}
              onChange={e => set('google_review_link', e.target.value)}
            />
            {!form.google_review_link && (
              <div className="sf-alert sf-alert-warn" style={{ marginTop: 8, marginBottom: 0 }}>
                Without this, post-job review requests are disabled. Add your Google review link to unlock the review flywheel.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="sf-card mb-3.5" style={{ borderColor: 'rgba(232,64,64,.25)' }}>
        <div className="sf-card-title" style={{ color: 'var(--err)' }}>Danger Zone</div>
        <div style={{ fontSize: 13, color: '#8fa3be', marginBottom: 14, lineHeight: 1.6 }}>
          Permanently remove this client and all associated call logs, SMS history, and sequences. This cannot be undone.
        </div>
        <button
          className="sf-btn-danger"
          style={{ fontSize: 13, padding: '9px 18px' }}
          onClick={() => setShowConfirmDelete({ type: 'client', id: client.id, label: client.name })}
        >
          🗑 Delete Client: {client.name}
        </button>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3.5">
        <button className="sf-btn-primary" onClick={save} disabled={saving}>
          {saving ? <span className="animate-spin-slow">◌</span> : null} SAVE CHANGES
        </button>
        {configSaved && (
          <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono'", color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 5 }}>
            ✓ Configuration saved
          </div>
        )}
      </div>
    </div>
  )
}
