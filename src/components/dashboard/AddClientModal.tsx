import React, { useState } from 'react'
import { useAppStore } from '../../stores/app'
import { PhonePicker } from '../phone/PhonePicker'
import { BUSINESS_TYPES, DEFAULT_SMS_TEMPLATES } from '../../constants/brand'
import type { ClientInsert, BusinessType } from '../../types'
import type { AvailableNumber } from '../../hooks/usePhoneProvisioning'

interface Props {
  onAdd: (insert: ClientInsert) => Promise<void>
}

const BLANK: Partial<ClientInsert> = {
  name: '', business_type: 'plumbing', avg_job_value: 300,
  booking_link: '', google_review_link: '',
  blackout_start: 22, blackout_end: 7, send_delay_seconds: 5,
  is_active: true,
}

export function AddClientModal({ onAdd }: Props) {
  const { setShowAddClientModal, setSelectedPhone, selectedPhone } = useAppStore()
  const [form, setForm] = useState({ ...BLANK })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = (k: string, v: any) => {
    setForm(f => {
      const next = { ...f, [k]: v }
      // Auto-update SMS template when business type changes
      if (k === 'business_type') {
        next.sms_template = DEFAULT_SMS_TEMPLATES[v as BusinessType]
      }
      return next
    })
  }

  const handlePhoneSelect = (num: AvailableNumber) => {
    setSelectedPhone(num)
    set('twilio_phone_number', num.number)
  }

  const submit = async () => {
    if (!form.name?.trim()) { setErr('Business name is required.'); return }
    if (!selectedPhone && !form.twilio_phone_number) { setErr('Please claim a phone number.'); return }
    setSaving(true)
    setErr('')
    await onAdd({
      name: form.name!,
      business_type: form.business_type as BusinessType || 'other',
      twilio_phone_number: selectedPhone?.number || form.twilio_phone_number || '',
      forward_from_number: null,
      sms_template: form.sms_template || DEFAULT_SMS_TEMPLATES[form.business_type as BusinessType || 'other'],
      avg_job_value: Number(form.avg_job_value) || 300,
      blackout_start: Number(form.blackout_start) || 22,
      blackout_end: Number(form.blackout_end) || 7,
      send_delay_seconds: Number(form.send_delay_seconds) || 5,
      booking_link: form.booking_link || null,
      google_review_link: form.google_review_link || null,
      is_active: true,
    })
    setSelectedPhone(null)
    setShowAddClientModal(false)
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(5,7,13,.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && setShowAddClientModal(false)}
    >
      <div
        className="relative rounded-2xl overflow-hidden w-full animate-fade-up"
        style={{ background: 'var(--s1)', border: '1px solid var(--b2)', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Shimmer top bar */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, var(--blue3), var(--blue), var(--ember))', backgroundSize: '200% 100%' }} className="animate-shimmer" />

        <div style={{ padding: 28 }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, letterSpacing: '.06em', color: '#e8edf5', marginBottom: 20 }}>
            Deploy New Client
          </div>

          <div className="flex flex-col gap-3.5">
            {/* Business name */}
            <div className="flex flex-col gap-1.5">
              <label className="sf-label">Business Name *</label>
              <input className="sf-input" placeholder="Coral Gables Electric" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            </div>

            {/* Industry + job value */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="flex flex-col gap-1.5">
                <label className="sf-label">Industry</label>
                <select className="sf-input" value={form.business_type || 'plumbing'} onChange={e => set('business_type', e.target.value)}>
                  {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="sf-label">Avg Job Value ($)</label>
                <input className="sf-input" type="number" value={form.avg_job_value || 300} onChange={e => set('avg_job_value', e.target.value)} />
              </div>
            </div>

            {/* Booking link */}
            <div className="flex flex-col gap-1.5">
              <label className="sf-label">
                Booking Link <span style={{ color: 'var(--ember)' }}>★ 3x conversion lift</span>
              </label>
              <input className="sf-input" placeholder="https://cal.com/yourbusiness" value={form.booking_link || ''} onChange={e => set('booking_link', e.target.value)} />
            </div>

            {/* Phone number */}
            <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 14 }}>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.06em', marginBottom: 10 }}>
                CLAIM PHONE NUMBER <span style={{ color: '#4a6080', fontFamily: "'Inter'", fontSize: 11, fontWeight: 400, letterSpacing: 0 }}>— no Twilio account needed</span>
              </div>
              <PhonePicker
                selectedNumber={selectedPhone?.number}
                onSelect={handlePhoneSelect}
              />
              {selectedPhone && (
                <div className="flex items-center gap-2.5 rounded-lg mt-2"
                  style={{ background: 'var(--okbg)', border: '1px solid var(--okb)', padding: '10px 14px' }}>
                  <span style={{ fontSize: 18 }}>✓</span>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 600, color: 'var(--ok)' }}>{selectedPhone.number}</div>
                    <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: '#4a6080' }}>{selectedPhone.locality}, {selectedPhone.region} · Provisioned</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {err && <div className="sf-alert sf-alert-err mt-3.5">{err}</div>}

          <div className="flex gap-2.5 mt-5">
            <button className="sf-btn-ghost flex-1" onClick={() => setShowAddClientModal(false)}>Cancel</button>
            <button className="sf-btn-primary" style={{ flex: 2 }} onClick={submit} disabled={saving}>
              {saving ? <span className="animate-spin-slow">◌</span> : '⚡ DEPLOY CLIENT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
