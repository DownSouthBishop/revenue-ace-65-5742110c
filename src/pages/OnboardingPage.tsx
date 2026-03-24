import React, { useState } from 'react'
import { EagleLogo } from '../components/ui/EagleLogo'
import { PhonePicker } from '../components/phone/PhonePicker'
import { BUSINESS_TYPES, DEFAULT_SMS_TEMPLATES, SMS_VARIABLES } from '../constants/brand'
import { useAppStore } from '../stores/app'
import { clients as clientsApi } from '../lib/supabase'
import type { BusinessType } from '../types'
import type { AvailableNumber } from '../hooks/usePhoneProvisioning'

interface Props { onComplete: () => void }

const STEPS = ['Business Setup', 'Phone Number', 'SMS Config', 'Go Live']

export function OnboardingPage({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const { selectedPhone, setSelectedPhone } = useAppStore()

  const [form, setForm] = useState({
    name: '',
    business_type: 'plumbing' as BusinessType,
    avg_job_value: 300,
    booking_link: '',
    google_review_link: '',
    forward_from_number: '',
    sms_template: DEFAULT_SMS_TEMPLATES.plumbing,
    blackout_start: 22,
    blackout_end: 7,
    send_delay_seconds: 5,
  })

  const set = (k: string, v: any) => setForm(f => {
    const next = { ...f, [k]: v }
    if (k === 'business_type') next.sms_template = DEFAULT_SMS_TEMPLATES[v as BusinessType]
    return next
  })

  const preview = () => form.sms_template
    .replace(/{business_name}/g, form.name || 'Your Business')
    .replace(/{caller_number}/g, '+1 (305) 555-0191')
    .replace(/{time}/g, '2:34 PM')
    .replace(/{booking_link}/g, form.booking_link || 'https://cal.com/yourbusiness')

  const next = async () => {
    setErr('')
    if (step === 0) {
      if (!form.name.trim()) { setErr('Business name is required.'); return }
      setStep(1)
    } else if (step === 1) {
      if (!selectedPhone) { setErr('Please claim a phone number to continue.'); return }
      setStep(2)
    } else if (step === 2) {
      setSaving(true)
      try {
        await clientsApi.create({
          name: form.name,
          business_type: form.business_type,
          twilio_phone_number: selectedPhone!.number,
          forward_from_number: form.forward_from_number || null,
          sms_template: form.sms_template,
          avg_job_value: form.avg_job_value,
          blackout_start: form.blackout_start,
          blackout_end: form.blackout_end,
          send_delay_seconds: form.send_delay_seconds,
          booking_link: form.booking_link || null,
          google_review_link: form.google_review_link || null,
          is_active: true,
        })
        setStep(3)
      } catch (e: any) {
        setErr(e.message || 'Failed to save client.')
      } finally {
        setSaving(false)
      }
    } else {
      setSelectedPhone(null)
      onComplete()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div style={{ width: '100%', maxWidth: 600 }}>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block mb-3.5" style={{ filter: 'drop-shadow(0 0 10px rgba(30,127,212,.55))' }}>
            <EagleLogo size="lg" />
          </div>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 26, fontWeight: 700, letterSpacing: '.06em', color: '#e8edf5', marginBottom: 6 }}>
            Deploy <span style={{ color: 'var(--blue)' }}>Respondfall AI</span>
          </div>
          <div style={{ fontSize: 11, color: '#4a6080', fontFamily: "'JetBrains Mono'", letterSpacing: '.1em', textTransform: 'uppercase' }}>
            4 Steps · 5 Minutes · First Client Live
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div className="sf-progress mb-1.5">
                <div className={`sf-progress-fill${i <= step ? ' active' : ''}`} style={{ width: i <= step ? '100%' : '0%' }} />
              </div>
              <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: i <= step ? 'var(--blue)' : '#4a6080', textAlign: 'center', letterSpacing: '.07em', transition: 'color .4s' }}>
                {s}
              </div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="relative rounded-2xl overflow-hidden animate-fade-up"
          style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: 28 }}>
          <div className="absolute top-0 left-0 right-0 animate-shimmer"
            style={{ height: 2, background: 'linear-gradient(90deg, var(--blue3), var(--blue), var(--ember), var(--blue3))', backgroundSize: '200% 100%' }} />

          {/* Step 0: Business setup */}
          {step === 0 && (
            <>
              <StepTitle n={1} title="Business Intelligence Setup" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }} className="flex flex-col gap-1.5">
                  <label className="sf-label">Business Name *</label>
                  <input className="sf-input" placeholder="Miami Plumbing Co." value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="sf-label">Industry</label>
                  <select className="sf-input" value={form.business_type} onChange={e => set('business_type', e.target.value)}>
                    {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="sf-label">Avg Job Value ($)</label>
                  <input className="sf-input" type="number" value={form.avg_job_value} onChange={e => set('avg_job_value', Number(e.target.value))} />
                </div>
                <div style={{ gridColumn: '1/-1' }} className="flex flex-col gap-1.5">
                  <label className="sf-label">Booking Link <span style={{ color: 'var(--ember)' }}>★ 3x conversion boost</span></label>
                  <input className="sf-input" placeholder="https://cal.com/yourbusiness" value={form.booking_link} onChange={e => set('booking_link', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1/-1' }} className="flex flex-col gap-1.5">
                  <label className="sf-label">Google Review Link <span style={{ color: '#4a6080' }}>(enables post-job review requests)</span></label>
                  <input className="sf-input" placeholder="https://g.page/r/.../review" value={form.google_review_link} onChange={e => set('google_review_link', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* Step 1: Phone number */}
          {step === 1 && (
            <>
              <StepTitle n={2} title="Claim Your Dedicated Phone Number" />
              <div className="sf-alert sf-alert-tip mb-4">
                <strong>No Twilio account needed.</strong> SkyforgeAI provisions your number instantly — search by area code or city. Billed through your plan at ~$1.15/month.
              </div>
              <PhonePicker selectedNumber={selectedPhone?.number} onSelect={n => setSelectedPhone(n)} />
              {selectedPhone && (
                <div className="flex items-center gap-2.5 rounded-lg mt-2"
                  style={{ background: 'var(--okbg)', border: '1px solid var(--okb)', padding: '10px 14px' }}>
                  <span style={{ fontSize: 18 }}>✓</span>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 600, color: 'var(--ok)' }}>{selectedPhone.number}</div>
                    <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: '#4a6080' }}>Provisioned · SkyforgeAI Infrastructure</div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1.5 mt-3.5">
                <label className="sf-label">Client's Existing Number <span style={{ color: '#4a6080' }}>(optional — for forwarding setup)</span></label>
                <input className="sf-input" placeholder="+13055559999" value={form.forward_from_number} onChange={e => set('forward_from_number', e.target.value)} />
                <div style={{ fontSize: 11, color: '#4a6080', fontFamily: "'JetBrains Mono'", marginTop: 3 }}>→ Unanswered calls from this number forward to Respondfall automatically</div>
              </div>
            </>
          )}

          {/* Step 2: SMS config */}
          {step === 2 && (
            <>
              <StepTitle n={3} title="SMS Recovery System" />
              <div className="flex flex-col gap-1.5 mb-3">
                <div className="flex items-center justify-between">
                  <label className="sf-label" style={{ marginBottom: 0 }}>Initial SMS (fires immediately on missed call)</label>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: form.sms_template.length > 160 ? 'var(--err)' : '#4a6080' }}>
                    {form.sms_template.length}/160
                  </span>
                </div>
                <textarea className="sf-input" style={{ minHeight: 90, lineHeight: 1.6 }}
                  value={form.sms_template} onChange={e => set('sms_template', e.target.value)} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#4a6080', fontFamily: "'JetBrains Mono'" }}>INSERT:</span>
                  {SMS_VARIABLES.map(v => (
                    <span key={v.label} style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", background: 'var(--bluedim)', color: 'var(--blue)', border: '1px solid var(--b2)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                      onClick={() => set('sms_template', form.sms_template + v.label)}>
                      {v.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preview bubble */}
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--b1)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: '#4a6080', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Live Preview</div>
                <div style={{ background: 'linear-gradient(135deg, var(--blue3), var(--blue2))', color: '#fff', borderRadius: '12px 12px 12px 2px', padding: '10px 14px', fontSize: 13, lineHeight: 1.6, maxWidth: 320, boxShadow: '0 0 16px var(--blueglow)' }}>
                  {preview()}
                </div>
                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: '#4a6080', textAlign: 'right', marginTop: 8 }}>
                  Delivered ✓ · Fires {form.send_delay_seconds}s after missed call · 3-touch follow-up pre-configured
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                <div className="flex flex-col gap-1.5">
                  <label className="sf-label">Blackout Start (0-23)</label>
                  <select className="sf-input" value={form.blackout_start} onChange={e => set('blackout_start', Number(e.target.value))}>
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="sf-label">Blackout End (0-23)</label>
                  <select className="sf-input" value={form.blackout_end} onChange={e => set('blackout_end', Number(e.target.value))}>
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
                  </select>
                </div>
              </div>

              <div className="sf-alert sf-alert-tip mt-3.5 mb-0">
                <strong>3-Touch Sequence pre-configured:</strong> Step 2 fires 2hrs later if no reply · Step 3 fires 24hrs later · Stops on reply or booking.
              </div>
            </>
          )}

          {/* Step 3: Go live */}
          {step === 3 && (
            <>
              <StepTitle n={4} title="Forward Your Calls — You're Live" />
              <div className="sf-alert sf-alert-ok">✓ Business deployed · SMS system live · Number provisioned</div>
              <div className="sf-alert sf-alert-tip">
                Last step: set up conditional forwarding so missed calls route to Respondfall. Client keeps their existing number — <strong>only unanswered calls forward</strong>. Takes 30 seconds.
              </div>
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--b1)', borderRadius: 12, padding: 18, marginBottom: 14 }}>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--blue)', letterSpacing: '.06em', marginBottom: 10 }}>
                  Your Respondfall Number
                </div>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 600, color: 'var(--ok)' }}>
                  {selectedPhone?.number}
                </div>
                <div style={{ fontSize: 11, color: '#4a6080', fontFamily: "'JetBrains Mono'", marginTop: 4 }}>
                  Copy this for the forwarding step below
                </div>
              </div>
              <div className="sf-alert sf-alert-ember mb-0">
                <strong>iPhone/Android (most common):</strong> Open Phone app → dial:{' '}
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, color: 'var(--ember)' }}>*61*+1XXXXXXXXXX*11*20#</span>
                <br />Replace XXXXXXXXXX with your Respondfall number digits. Full carrier guide in the <strong>Connect</strong> tab after launch.
              </div>
            </>
          )}

          {err && <div className="sf-alert sf-alert-err mt-3.5">{err}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {step > 0 && step < 3 && (
              <button className="sf-btn-ghost" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>← Back</button>
            )}
            <button className="sf-btn-primary" style={{ flex: 2 }} onClick={next} disabled={saving}>
              {saving ? <span className="animate-spin-slow">◌</span> : step === 3 ? '🚀 LAUNCH DASHBOARD' : 'CONTINUE →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, letterSpacing: '.05em', color: '#e8edf5', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue3), var(--blue2))', border: '1px solid var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{n}</div>
      {title}
    </div>
  )
}
