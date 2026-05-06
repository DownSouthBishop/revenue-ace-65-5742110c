import { useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { PhonePicker } from '@/components/PhonePicker';

const INDUSTRIES = ['plumbing', 'hvac', 'electrical', 'roofing', 'landscaping', 'cleaning', 'auto_repair', 'restaurant', 'salon', 'other'];

export function AddClientModal() {
  const { setShowAddModal, addClient } = useAppStore();
  const [name, setName] = useState('');
  const [type, setType] = useState('plumbing');
  const [jobVal, setJobVal] = useState(300);
  const [bookLink, setBookLink] = useState('');
  const [fwdNum, setFwdNum] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');

  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) { alert('Business name is required.'); return; }
    if (!selectedPhone) { alert('Please claim a phone number for this client.'); return; }
    if (fwdNum && !/^\+[1-9]\d{6,14}$/.test(fwdNum.replace(/[\s()-]/g, ''))) {
      alert('Business number must be in E.164 format (e.g. +15551234567).'); return;
    }
    setSaving(true);
    const { client, error } = await addClient({
      name,
      business_type: type,
      twilio_phone_number: selectedPhone,
      forward_from_number: fwdNum.replace(/[\s()-]/g, ''),
      sms_template: "Hey, {business_name} here — sorry we missed you! Book here: {booking_link}. Reply STOP.",
      avg_job_value: jobVal,
      blackout_start: 22,
      blackout_end: 7,
      send_delay_seconds: 5,
      booking_link: bookLink,
      google_review_link: '',
      is_active: true,
    });
    setSaving(false);
    if (!client) toast.error(error || 'Failed to save client. Please try again.');
    else toast.success('Client deployed');
  };

  return (
    <div className="fixed inset-0 bg-[rgba(5,7,13,0.85)] z-[200] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-up" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
      <div className="bg-s1 border border-blue-2 rounded-2xl p-7 w-full max-w-[520px] relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-0.5 gradient-bar" />
        <div className="font-display text-lg font-bold tracking-[.06em] text-foreground mb-5">Deploy New Client</div>

        <div className="flex flex-col gap-3.5">
          <div>
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Business Name *</label>
            <input className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={name} onChange={e => setName(e.target.value)} placeholder="Coral Gables Electric" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Industry</label>
              <select className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none cursor-pointer" value={type} onChange={e => setType(e.target.value)}>
                {INDUSTRIES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Avg Job Value ($)</label>
              <input type="number" className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={jobVal} onChange={e => setJobVal(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Your Business Number <span className="text-t3">(calls forward here first)</span></label>
            <input className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={fwdNum} onChange={e => setFwdNum(e.target.value)} placeholder="+15551234567" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Booking Link</label>
            <input className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={bookLink} onChange={e => setBookLink(e.target.value)} placeholder="https://cal.com/..." />
          </div>
          <div className="border-t border-blue pt-3.5">
            <div className="font-display text-[13px] font-bold text-sky tracking-[.06em] mb-2.5">CLAIM PHONE NUMBER</div>
            <PhonePicker onSelect={setSelectedPhone} selected={selectedPhone} />
            {selectedPhone && (
              <div className="flex items-center gap-2.5 p-2.5 bg-success-bg border border-success rounded-lg mt-2">
                <span className="text-lg">✓</span>
                <div className="font-mono text-sm font-semibold text-success">{selectedPhone}</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button className="flex-1 py-2.5 rounded-lg border border-blue-2 bg-transparent text-t2 font-display font-bold text-sm tracking-[.06em] uppercase cursor-pointer hover:bg-s2 transition-all active:scale-[0.98]" onClick={() => setShowAddModal(false)}>Cancel</button>
          <button disabled={saving} className="flex-[2] py-2.5 rounded-lg gradient-sky text-primary-foreground border-none font-display font-bold text-sm tracking-[.06em] uppercase cursor-pointer glow-sky hover:-translate-y-px transition-all active:scale-[0.98] disabled:opacity-50" onClick={handleAdd}>{saving ? '◌ DEPLOYING...' : '⚡ DEPLOY CLIENT'}</button>
        </div>
      </div>
    </div>
  );
}
