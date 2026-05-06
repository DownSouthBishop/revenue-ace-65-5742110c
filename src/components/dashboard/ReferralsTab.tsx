import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { toast } from 'sonner';
import type { Client } from '@/types/respondfall';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning-bg border-warning text-warning',
  contacted: 'bg-sky-dim border-blue-2 text-sky',
  converted: 'bg-success-bg border-success text-success',
};

function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '');
  const e164 = /^\+?[1-9]\d{7,14}$/;
  if (!e164.test(digits)) return null;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

export function ReferralsTab({ client: _client }: { client: Client }) {
  const referrals = useAppStore(s => s.referrals);
  const sendReferralRequest = useAppStore(s => s.sendReferralRequest);
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);

  const stats = useMemo(() => ({
    total: referrals.length,
    pending: referrals.filter(r => r.status === 'pending').length,
    converted: referrals.filter(r => r.status === 'converted').length,
  }), [referrals]);

  const handleSend = async () => {
    const normalized = normalizePhone(phone.trim());
    if (!normalized) {
      toast.error('Please enter a valid phone number (E.164 format, e.g. +15551234567)');
      return;
    }
    try {
      setSending(true);
      await sendReferralRequest(normalized);
      toast.success(`Referral request sent to ${normalized}`);
      setPhone('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send referral request');
    } finally {
      setSending(false);
    }
  };

  const sorted = [...referrals].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        {[
          { label: 'Total Referrals', value: stats.total, cls: 'text-sky' },
          { label: 'Pending', value: stats.pending, cls: 'text-warning' },
          { label: 'Converted', value: stats.converted, cls: 'text-success' },
        ].map((s, i) => (
          <div key={i} className="bg-s1 border border-blue rounded-xl p-3 lg:p-4 relative overflow-hidden">
            <div className="text-[9px] lg:text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-1.5 lg:mb-2.5">{s.label}</div>
            <div className={`font-display text-[22px] lg:text-[30px] font-bold tracking-[.03em] leading-none ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-s1 border border-blue rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-blue flex items-center justify-between">
          <div className="font-display text-sm font-bold tracking-[.04em] text-foreground">Referral Activity</div>
          <div className="text-[10px] font-mono text-t3 uppercase tracking-[.12em]">{referrals.length} total</div>
        </div>
        {sorted.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-3xl mb-2">🤝</div>
            <div className="text-sm text-foreground font-medium mb-1">No referrals yet</div>
            <div className="text-xs text-t3 max-w-md mx-auto">
              After marking a job complete, you can send a referral request to that customer from their conversation in Inbox.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--blue))]">
            {sorted.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">{r.referredName || '—'}</div>
                  <div className="text-[11px] font-mono text-t3 mt-0.5">
                    Code: <span className="text-sky">{r.trackingCode}</span>
                    {r.referredPhone && <> · {r.referredPhone}</>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[9px] font-mono uppercase tracking-[.1em] border rounded-full px-2 py-0.5 ${STATUS_STYLES[r.status] || ''}`}>
                    {r.status}
                  </span>
                  <span className="text-[10px] font-mono text-t4 hidden sm:inline">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send panel */}
      <div className="bg-s1 border border-blue rounded-xl p-4">
        <div className="font-display text-sm font-bold tracking-[.04em] text-foreground mb-1">Send Referral Request</div>
        <div className="text-[11px] font-mono text-t3 mb-3">Send a customer the referral SMS to capture a new lead.</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+15551234567"
            maxLength={20}
            className="flex-1 bg-s2 border border-blue rounded-md text-foreground text-xs font-mono px-3 py-2 focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSend}
            disabled={sending || !phone.trim()}
            className="gradient-sky text-primary-foreground rounded-md px-4 py-2 text-[11px] font-mono font-semibold tracking-[.06em] uppercase hover:glow-sky transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
