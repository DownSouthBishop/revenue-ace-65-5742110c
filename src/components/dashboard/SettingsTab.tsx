import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Client } from '@/types/respondfall';
import { PhonePicker } from '@/components/PhonePicker';

const INDUSTRIES = ['plumbing', 'hvac', 'electrical', 'roofing', 'landscaping', 'cleaning', 'auto_repair', 'restaurant', 'salon', 'real_estate', 'medical', 'other'];

export function SettingsTab({ client }: { client: Client }) {
  const { updateClient, setConfirmDel } = useAppStore();
  const [name, setName] = useState(client.name);
  const [type, setType] = useState(client.business_type);
  const [jobVal, setJobVal] = useState(client.avg_job_value);
  const [template, setTemplate] = useState(client.sms_template);
  const [delay, setDelay] = useState(client.send_delay_seconds);
  const [bStart, setBStart] = useState(client.blackout_start);
  const [bEnd, setBEnd] = useState(client.blackout_end);
  const [bookLink, setBookLink] = useState(client.booking_link);
  const [reviewLink, setReviewLink] = useState(client.google_review_link);
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateClient(client.id, {
      name, business_type: type, avg_job_value: jobVal, sms_template: template,
      send_delay_seconds: delay, blackout_start: bStart, blackout_end: bEnd,
      booking_link: bookLink, google_review_link: reviewLink,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5"><span className="w-[3px] h-4 gradient-indicator rounded-sm" />Business Profile</div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2">
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Business Name</label>
            <input className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Industry</label>
            <select className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-2.5 outline-none cursor-pointer" value={type} onChange={e => setType(e.target.value)}>
              {INDUSTRIES.map(t => <option key={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Avg Job Value ($)</label>
            <input type="number" className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={jobVal} onChange={e => setJobVal(parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5"><span className="w-[3px] h-4 gradient-indicator rounded-sm" />Phone Number</div>
        <div className="mb-3.5">
          <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Current Respondfall Number</label>
          <div className="font-mono text-base font-semibold text-success p-2.5 px-3 bg-3 border border-success rounded-lg">{client.twilio_phone_number}</div>
        </div>
        <div className="bg-sky-dim border border-blue-2 rounded-lg p-3 text-xs text-t2 mb-3.5 leading-relaxed border-l-[3px] border-l-primary">To change your number, use the search below to claim a new one.</div>
        <PhonePicker onSelect={() => {}} selected="" />
      </div>

      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5"><span className="w-[3px] h-4 gradient-indicator rounded-sm" />SMS Configuration</div>
        <div className="flex flex-col gap-3.5">
          <div>
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Initial SMS Template</label>
            <textarea className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-2.5 outline-none focus:border-primary min-h-[78px] resize-y" value={template} onChange={e => setTemplate(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Send Delay (s)</label>
              <input type="number" min={0} max={60} className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={delay} onChange={e => setDelay(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Blackout Start</label>
              <input type="number" min={0} max={23} className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={bStart} onChange={e => setBStart(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Blackout End</label>
              <input type="number" min={0} max={23} className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={bEnd} onChange={e => setBEnd(parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5"><span className="w-[3px] h-4 gradient-indicator rounded-sm" />Revenue Multipliers</div>
        <div className="flex flex-col gap-3.5">
          <div>
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Booking Link <span className="text-ember">★ Critical</span></label>
            <input className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={bookLink} onChange={e => setBookLink(e.target.value)} placeholder="https://cal.com/yourbusiness" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Google Review Link <span className="text-gold">★ Post-job review requests</span></label>
            <input className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={reviewLink} onChange={e => setReviewLink(e.target.value)} placeholder="https://g.page/r/.../review" />
            {!reviewLink && (
              <div className="bg-[hsl(var(--warning-bg))] border border-[hsl(var(--warning-border))] rounded-lg p-2.5 text-xs text-[hsl(var(--warning))] mt-2 leading-relaxed">
                Without this, post-job review requests are disabled. Add your Google review link to unlock.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 text-destructive flex items-center gap-2.5"><span className="w-[3px] h-4 bg-destructive rounded-sm" />Danger Zone</div>
        <div className="text-[13px] text-t2 mb-3.5">Permanently remove this client and all associated data. This cannot be undone.</div>
        <button className="bg-[hsl(var(--destructive)/0.08)] text-destructive border border-destructive/20 rounded-[7px] py-2 px-4 cursor-pointer text-[13px] font-mono flex items-center gap-1.5 hover:bg-[hsl(var(--destructive)/0.15)] transition-all" onClick={() => setConfirmDel({ type: 'client', id: client.id, label: client.name })}>
          🗑 Delete Client
        </button>
      </div>

      <div className="flex items-center gap-3.5">
        <button className="gradient-sky text-primary-foreground border-none rounded-lg py-2.5 px-6 font-display text-sm font-bold tracking-[.06em] uppercase cursor-pointer glow-sky hover:-translate-y-px transition-all active:scale-[0.98]" onClick={save}>SAVE CHANGES</button>
        {saved && <div className="text-xs font-mono text-success flex items-center gap-1">✓ Configuration saved</div>}
      </div>
    </div>
  );
}
