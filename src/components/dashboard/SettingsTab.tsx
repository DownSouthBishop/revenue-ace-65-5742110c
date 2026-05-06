import { forwardRef, useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types/respondfall';
import { PhonePicker } from '@/components/PhonePicker';
import { SystemHealthCard, exportLeadsCSV, enablePushNotifications } from './SystemHealth';

const INDUSTRIES = ['plumbing', 'hvac', 'electrical', 'roofing', 'landscaping', 'cleaning', 'auto_repair', 'restaurant', 'salon', 'real_estate', 'medical', 'other'];
const TIMEZONES = ['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix','America/Anchorage','Pacific/Honolulu','UTC'];

export const SettingsTab = forwardRef<HTMLDivElement, { client: Client }>(
  function SettingsTab({ client }, ref) {
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
    const [fwdNum, setFwdNum] = useState(client.forward_from_number);
    const [tz, setTz] = useState(client.timezone || 'America/New_York');
    const [active, setActive] = useState(client.is_active);
    const [cap, setCap] = useState(client.daily_sms_cap ?? 200);
    const [fwdTimeout, setFwdTimeout] = useState(client.forward_timeout_seconds ?? 18);
    const [saved, setSaved] = useState(false);

    const save = async () => {
      const { error } = await updateClient(client.id, {
        name, business_type: type, avg_job_value: jobVal, sms_template: template,
        send_delay_seconds: delay, blackout_start: bStart, blackout_end: bEnd,
        booking_link: bookLink, google_review_link: reviewLink, forward_from_number: fwdNum,
        timezone: tz, is_active: active, daily_sms_cap: cap, forward_timeout_seconds: fwdTimeout,
      });
      if (error) {
        toast.error('Save failed — please try again');
        return;
      }
      toast.success('Settings saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    };

    const handlePhoneChange = (num: string) => {
      updateClient(client.id, { twilio_phone_number: num });
    };

    return (
      <div ref={ref}>
        <SystemHealthCard client={client} />

        <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
          <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5"><span className="w-[3px] h-4 gradient-indicator rounded-sm" />Operations</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Timezone (for blackout)</label>
              <select className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none cursor-pointer" value={tz} onChange={e => setTz(e.target.value)}>
                {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Daily SMS Cap</label>
              <input type="number" min={10} max={5000} className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={cap} onChange={e => setCap(parseInt(e.target.value) || 200)} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Forward Ring Time (s)</label>
              <input type="number" min={5} max={45} className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary" value={fwdTimeout} onChange={e => setFwdTimeout(parseInt(e.target.value) || 18)} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-foreground py-2">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 accent-primary" />
                System Active (sends SMS automatically)
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => exportLeadsCSV(client.id, client.name)} aria-label="Export leads as CSV" className="bg-s2 border border-blue rounded-md text-t2 text-[11px] font-mono px-3 py-2 cursor-pointer hover:text-sky hover:border-primary transition-all">⬇ Export Leads CSV</button>
            <button onClick={enablePushNotifications} aria-label="Enable browser notifications" className="bg-s2 border border-blue rounded-md text-t2 text-[11px] font-mono px-3 py-2 cursor-pointer hover:text-sky hover:border-primary transition-all">🔔 Enable Notifications</button>
          </div>
        </div>

        <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
          <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5"><span className="w-[3px] h-4 gradient-indicator rounded-sm" />Business Profile</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
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
          <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5"><span className="w-[3px] h-4 gradient-indicator rounded-sm" />Phone Numbers</div>
          <div className="mb-3.5">
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Current Respondfall Number</label>
            <div className="font-mono text-base font-semibold text-success p-2.5 px-3 bg-3 border border-success rounded-lg">{client.twilio_phone_number}</div>
          </div>
          <div className="mb-3.5">
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Your Business Number <span className="text-t3">(calls forward from here)</span></label>
            <input
              className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-2.5 outline-none focus:border-primary"
              value={fwdNum}
              onChange={e => setFwdNum(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
            <div className="text-[11px] text-t3 font-mono mt-1">Enter the number your customers call. Missed calls will forward to your Respondfall number above.</div>
          </div>
          <div className="bg-sky-dim border border-blue-2 rounded-lg p-3 text-xs text-t2 mb-3.5 leading-relaxed border-l-[3px] border-l-primary">To change your Respondfall number, search and claim a new one below.</div>
          <PhonePicker onSelect={handlePhoneChange} selected={client.twilio_phone_number} />
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
          <div className="text-[13px] text-t2 mb-3.5">Sign out of your account, or permanently remove this client and all associated data.</div>
          <div className="flex flex-col gap-2.5">
            <button
              className="w-full py-2.5 rounded-lg border border-blue-2 bg-transparent text-t2 font-display text-sm font-bold tracking-[.06em] uppercase cursor-pointer hover:bg-s2 hover:text-foreground transition-all"
              onClick={async () => {
                await supabase.auth.signOut();
                useAppStore.setState({ clients: [], activeClientId: '', page: 'auth' });
              }}
            >
              Sign Out
            </button>
            <button className="bg-[hsl(var(--destructive)/0.08)] text-destructive border border-destructive/20 rounded-[7px] py-2 px-4 cursor-pointer text-[13px] font-mono flex items-center gap-1.5 hover:bg-[hsl(var(--destructive)/0.15)] transition-all" onClick={() => setConfirmDel({ type: 'client', id: client.id, label: client.name })}>
              🗑 Delete Client
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <button className="gradient-sky text-primary-foreground border-none rounded-lg py-2.5 px-6 font-display text-sm font-bold tracking-[.06em] uppercase cursor-pointer glow-sky hover:-translate-y-px transition-all active:scale-[0.98]" onClick={save}>SAVE CHANGES</button>
          {saved && <div className="text-xs font-mono text-success flex items-center gap-1">✓ Configuration saved</div>}
        </div>
      </div>
    );
  }
);
