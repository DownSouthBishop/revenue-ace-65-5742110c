import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { PhonePicker } from '@/components/PhonePicker';

const INDUSTRIES = ['plumbing', 'hvac', 'electrical', 'roofing', 'landscaping', 'cleaning', 'auto_repair', 'restaurant', 'salon', 'real_estate', 'medical', 'legal', 'other'];
const STEPS = ['Business', 'Phone', 'SMS', 'Launch'];

export default function OnboardPage() {
  const { obStep, setObStep, obForm, setObForm, addClient, setPage } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleNext = async () => {
    setErr('');
    if (obStep === 0) {
      if (!obForm.name.trim()) { setErr('Business name is required.'); return; }
      setObStep(1);
    } else if (obStep === 1) {
      if (!obForm.selectedPhoneNumber) { setErr('Please claim a phone number to continue.'); return; }
      setObStep(2);
    } else if (obStep === 2) {
      if (!obForm.forward_from_number.trim()) { setErr('Your business phone number is required.'); return; }
      setSaving(true);
      const { client, error } = await addClient({
        name: obForm.name,
        business_type: obForm.business_type,
        twilio_phone_number: obForm.selectedPhoneNumber,
        forward_from_number: obForm.forward_from_number,
        sms_template: obForm.sms_template,
        avg_job_value: obForm.avg_job_value,
        blackout_start: obForm.blackout_start,
        blackout_end: obForm.blackout_end,
        send_delay_seconds: obForm.send_delay_seconds,
        booking_link: obForm.booking_link,
        google_review_link: obForm.google_review_link,
        is_active: true,
      });
      setSaving(false);
      if (!client) { setErr(error || 'Failed to save client. Please try again.'); return; }
      setObStep(3);
    } else {
      setPage('dashboard');
    }
  };

  const previewText = obForm.sms_template
    .replace(/{business_name}/g, obForm.name || 'Your Business')
    .replace(/{booking_link}/g, obForm.booking_link || 'https://cal.com/yourbiz')
    .replace(/{caller_number}/g, '+1 (555) 000-0000')
    .replace(/{time}/g, new Date().toLocaleTimeString());

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[600px]">
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold tracking-[.06em] text-foreground">
            Deploy <span className="text-sky">Respondfall</span>
          </h1>
          <p className="text-[11px] text-t3 font-mono tracking-[.1em] uppercase">Revenue Recovery System</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-5 sm:mb-6">
          {STEPS.map((name, i) => (
            <div key={name} className="flex-1">
              <div className={`h-[3px] rounded-sm mb-1.5 transition-colors duration-400 ${i <= obStep ? 'gradient-bar' : 'bg-s3'}`} />
              <div className={`text-[9px] sm:text-[10px] font-mono text-center tracking-[.07em] transition-colors duration-400 ${i <= obStep ? 'text-sky' : 'text-t3'}`}>{name}</div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-s1 border border-blue rounded-2xl p-5 sm:p-7 relative overflow-hidden animate-fade-up">
          <div className="absolute top-0 left-0 right-0 h-0.5 gradient-shimmer" />

          {obStep === 0 && (
            <div>
              <div className="flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-[.05em] mb-5">
                <div className="w-7 h-7 rounded-full gradient-sky border border-primary flex items-center justify-center text-xs font-bold text-primary-foreground glow-sky">1</div>
                Business Intelligence Setup
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Business Name *</label>
                  <input className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-3 outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--sky-dim))]" value={obForm.name} onChange={e => setObForm({ name: e.target.value })} placeholder="Miami Plumbing Co." />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Industry</label>
                  <select className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-3 outline-none cursor-pointer focus:border-primary" value={obForm.business_type} onChange={e => setObForm({ business_type: e.target.value })}>
                    {INDUSTRIES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Avg Job Value ($)</label>
                  <input type="number" className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-3 outline-none focus:border-primary" value={obForm.avg_job_value} onChange={e => setObForm({ avg_job_value: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Booking Link <span className="text-ember">★ 3x conversion boost</span></label>
                  <input className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-3 outline-none focus:border-primary" value={obForm.booking_link} onChange={e => setObForm({ booking_link: e.target.value })} placeholder="https://cal.com/yourbusiness" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Google Review Link <span className="text-t3">(for post-job review requests)</span></label>
                  <input className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-3 outline-none focus:border-primary" value={obForm.google_review_link} onChange={e => setObForm({ google_review_link: e.target.value })} placeholder="https://g.page/r/.../review" />
                </div>
              </div>
            </div>
          )}

          {obStep === 1 && (
            <div>
              <div className="flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-[.05em] mb-5">
                <div className="w-7 h-7 rounded-full gradient-sky border border-primary flex items-center justify-center text-xs font-bold text-primary-foreground glow-sky">2</div>
                Claim Your Dedicated Phone Number
              </div>
              <div className="bg-sky-dim border border-blue-2 rounded-lg p-3 text-[12px] text-t2 mb-4 leading-relaxed border-l-[3px] border-l-primary">
                <strong className="text-sky">No external accounts needed.</strong> Your number is provisioned instantly. Search by area code or city.
              </div>
              <PhonePicker onSelect={(num) => setObForm({ selectedPhoneNumber: num })} selected={obForm.selectedPhoneNumber} />
              {obForm.selectedPhoneNumber && (
                <div className="flex items-center gap-2.5 p-3 bg-success-bg border border-success rounded-lg mt-2">
                  <span className="text-lg">✓</span>
                  <div>
                    <div className="font-mono text-sm font-semibold text-success">{obForm.selectedPhoneNumber}</div>
                    <div className="text-[11px] font-mono text-t3">Provisioned · Respondfall Infrastructure</div>
                  </div>
                </div>
              )}
              <div className="mt-3.5">
                <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Your Business Phone Number <span className="text-ember">★ Required</span></label>
                <input className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-3 outline-none focus:border-primary" value={obForm.forward_from_number} onChange={e => setObForm({ forward_from_number: e.target.value })} placeholder="+1 (305) 555-9999" />
                <div className="text-[11px] text-t3 font-mono mt-1">Enter the number your customers already call. Missed calls will forward to your new Respondfall number.</div>
              </div>
            </div>
          )}

          {obStep === 2 && (
            <div>
              <div className="flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-[.05em] mb-5">
                <div className="w-7 h-7 rounded-full gradient-sky border border-primary flex items-center justify-center text-xs font-bold text-primary-foreground glow-sky">3</div>
                SMS Recovery System
              </div>
              <div className="mb-3">
                <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Initial SMS (fires on missed call)</label>
                <textarea className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-3 outline-none focus:border-primary min-h-[90px] resize-y leading-relaxed" value={obForm.sms_template} onChange={e => setObForm({ sms_template: e.target.value })} />
                <div className="flex gap-1.5 flex-wrap mt-2 items-center">
                  <span className="text-[10px] text-t3 font-mono">INSERT:</span>
                  {['{business_name}', '{caller_number}', '{time}', '{booking_link}'].map(v => (
                    <button key={v} className="text-[11px] font-mono bg-sky-dim text-sky border border-blue-2 rounded px-2 py-0.5 cursor-pointer hover:bg-[rgba(30,127,212,0.2)] transition-all" onClick={() => setObForm({ sms_template: obForm.sms_template + v })}>{v}</button>
                  ))}
                  <span className={`text-[11px] font-mono ml-auto ${obForm.sms_template.length > 160 ? 'text-destructive' : 'text-t3'}`}>{obForm.sms_template.length}/160</span>
                </div>
              </div>
              <div className="bg-3 border border-blue rounded-xl p-4 mt-2.5">
                <div className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-2.5">Live Preview</div>
                <div className="gradient-sky text-primary-foreground rounded-xl rounded-bl-sm p-3 text-[13px] leading-relaxed max-w-[320px] glow-sky">{previewText}</div>
                <div className="text-[10px] font-mono text-t3 text-right mt-2">Delivered ✓ · Fires {obForm.send_delay_seconds}s after missed call</div>
              </div>
            </div>
          )}

          {obStep === 3 && (
            <div>
              <div className="flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-[.05em] mb-5">
                <div className="w-7 h-7 rounded-full gradient-sky border border-primary flex items-center justify-center text-xs font-bold text-primary-foreground glow-sky">4</div>
                Forward Your Calls — You're Live
              </div>
              <div className="bg-success-bg border border-success rounded-lg p-2.5 text-[12px] text-success mb-3.5">✓ Business deployed · SMS system live · Number provisioned</div>
              <div className="bg-sky-dim border border-blue-2 rounded-lg p-3 text-[12px] text-t2 mb-4 leading-relaxed border-l-[3px] border-l-primary">
                Set up conditional forwarding so missed calls route to your Respondfall number. <strong className="text-sky">Only unanswered calls</strong> forward — your phone still rings first.
              </div>
              <div className="bg-s1 border border-blue rounded-xl p-4 mb-3.5">
                <div className="font-display text-[13px] text-sky tracking-[.06em] mb-2.5">Your Respondfall Number</div>
                <div className="font-mono text-lg font-semibold text-success">{obForm.selectedPhoneNumber || '(your number)'}</div>
              </div>
              <div className="bg-ember-dim border border-ember rounded-lg p-3 text-[12px] text-t2 leading-relaxed border-l-[3px] border-l-accent">
                <strong className="text-ember">iPhone / Android:</strong> Open Phone app and dial:<br />
                <span className="font-mono text-[13px] text-ember">*61*+1XXXXXXXXXX*11*20#</span><br />
                <span className="text-[11px] text-t3 mt-1 block">Replace XXXXXXXXXX with your Respondfall number digits. Full instructions are in the Connect tab.</span>
              </div>
            </div>
          )}

          {err && <div className="bg-[hsl(var(--destructive)/0.08)] border border-destructive rounded-lg p-2.5 text-[12px] text-destructive mt-3.5">{err}</div>}

          <div className="flex gap-2.5 mt-6">
            {obStep > 0 && obStep < 3 && (
              <button className="flex-1 py-3 rounded-lg border border-blue-2 bg-transparent text-t2 font-display text-sm font-bold tracking-[.06em] uppercase cursor-pointer hover:bg-s2 hover:text-foreground transition-all active:scale-[0.98]" onClick={() => setObStep(obStep - 1)}>← Back</button>
            )}
            <button className="flex-[2] py-3 rounded-lg gradient-sky text-primary-foreground border-none font-display text-sm font-bold tracking-[.06em] uppercase cursor-pointer glow-sky hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]" onClick={handleNext} disabled={saving}>
              {saving ? (obStep === 2 ? '◌ CLAIMING YOUR NUMBER...' : '◌ DEPLOYING...') : obStep === 3 ? '🚀 LAUNCH DASHBOARD' : 'CONTINUE →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
