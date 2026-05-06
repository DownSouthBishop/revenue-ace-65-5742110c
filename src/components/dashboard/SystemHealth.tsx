import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types/respondfall';
import type { Database } from '@/integrations/supabase/types';

type SystemHealthRow = Database['public']['Tables']['system_health']['Row'];

export function SystemHealthCard({ client }: { client: Client }) {
  const [h, setH] = useState<SystemHealthRow | null>(null);
  const [pending, setPending] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from('system_health').select('*').eq('client_id', client.id).maybeSingle(),
      supabase.from('scheduled_messages').select('id', { count: 'exact', head: true }).eq('client_id', client.id).eq('status', 'pending'),
    ]).then(([sh, sm]) => { if (!active) return; setH(sh.data); setPending(sm.count ?? 0); });
    return () => { active = false; };
  }, [client.id]);
  const ok = h && !h.last_error && (h.consecutive_failures ?? 0) === 0;
  return (
    <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
      <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5">
        <span className="w-[3px] h-4 gradient-indicator rounded-sm" />System Health
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div><div className="text-t3 font-mono uppercase text-[10px] mb-1">Status</div><div className={ok ? 'text-success' : 'text-ember'}>{ok ? '● Healthy' : '● Issues'}</div></div>
        <div><div className="text-t3 font-mono uppercase text-[10px] mb-1">Last webhook</div><div className="text-foreground">{h?.last_webhook_ping ? new Date(h.last_webhook_ping).toLocaleString() : '—'}</div></div>
        <div><div className="text-t3 font-mono uppercase text-[10px] mb-1">Last send</div><div className="text-foreground">{h?.last_successful_send ? new Date(h.last_successful_send).toLocaleString() : '—'}</div></div>
        <div><div className="text-t3 font-mono uppercase text-[10px] mb-1">Pending follow-ups</div><div className="text-foreground">{pending}</div></div>
      </div>
      {h?.last_error && (
        <div className="mt-3 text-[12px] text-destructive bg-[hsl(var(--destructive)/0.06)] border border-destructive/20 rounded-lg p-2.5 font-mono break-all">
          {h.last_error}
        </div>
      )}
    </div>
  );
}

export async function exportLeadsCSV(clientId: string, businessName: string) {
  const [calls, msgs] = await Promise.all([
    supabase.from('missed_calls').select('*').eq('client_id', clientId).order('called_at', { ascending: false }),
    supabase.from('messages').select('*').eq('client_id', clientId).order('sent_at', { ascending: true }),
  ]);
  const rows = [['type', 'caller', 'direction', 'body_or_transcript', 'timestamp']];
  (calls.data ?? []).forEach((c: any) => rows.push(['missed_call', c.caller_number, '', (c.voicemail_transcript || c.transcript || '').replace(/\n/g, ' '), c.called_at]));
  (msgs.data ?? []).forEach((m: any) => rows.push(['sms', m.caller_number, m.direction, (m.body || '').replace(/\n/g, ' '), m.sent_at]));
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${businessName.replace(/\W+/g, '_')}_leads_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export async function enablePushNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    toast.error('Push notifications are not supported in this browser.');
    return false;
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if ('PushManager' in window && vapidKey) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (!existing) {
        await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
        });
      }
    } catch (err) {
      console.warn('Push subscription failed:', err);
    }
  }
  return true;
}
