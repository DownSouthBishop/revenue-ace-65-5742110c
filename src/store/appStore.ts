import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, CallLog, SmsLog, PhoneNumber, TabId, PageId, AuthMode, QualificationFlow, QualReason, Referral } from '@/types/respondfall';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type MissedCallRow = Database['public']['Tables']['missed_calls']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

export const STOP_KEYWORDS = new Set(['STOP', 'STOP.', 'UNSUBSCRIBE', 'CANCEL', 'QUIT']);
export const isStopKeyword = (body: string) => STOP_KEYWORDS.has((body || '').trim().toUpperCase());

// Map a DB row from public.clients to the frontend Client shape
const rowToClient = (r: ClientRow): Client => ({
  id: r.id,
  name: r.business_name ?? '',
  business_type: r.industry ?? 'general',
  twilio_phone_number: r.respondfall_number ?? '',
  forward_from_number: r.business_number ?? '',
  sms_template: r.sms_template ?? '',
  avg_job_value: Number(r.avg_job_value ?? 0),
  blackout_start: r.blackout_start ?? 22,
  blackout_end: r.blackout_end ?? 7,
  send_delay_seconds: r.send_delay_seconds ?? 5,
  booking_link: r.booking_link ?? '',
  google_review_link: r.google_review_link ?? '',
  is_active: r.system_active ?? true,
  timezone: r.timezone ?? 'America/New_York',
  daily_sms_cap: r.daily_sms_cap ?? 200,
  forward_timeout_seconds: r.forward_timeout_seconds ?? 18,
  twilio_number_sid: r.twilio_number_sid ?? undefined,
});

const clientToRow = (c: Partial<Client>): Partial<ClientInsert> => {
  const row: Partial<ClientInsert> = {};
  if (c.name !== undefined) row.business_name = c.name;
  if (c.business_type !== undefined) row.industry = c.business_type;
  if (c.twilio_phone_number !== undefined) row.respondfall_number = c.twilio_phone_number;
  if (c.forward_from_number !== undefined) row.business_number = c.forward_from_number;
  if (c.sms_template !== undefined) row.sms_template = c.sms_template;
  if (c.avg_job_value !== undefined) row.avg_job_value = c.avg_job_value;
  if (c.blackout_start !== undefined) row.blackout_start = c.blackout_start;
  if (c.blackout_end !== undefined) row.blackout_end = c.blackout_end;
  if (c.send_delay_seconds !== undefined) row.send_delay_seconds = c.send_delay_seconds;
  if (c.booking_link !== undefined) row.booking_link = c.booking_link;
  if (c.google_review_link !== undefined) row.google_review_link = c.google_review_link;
  if (c.is_active !== undefined) row.system_active = c.is_active;
  if (c.timezone !== undefined) row.timezone = c.timezone;
  if (c.daily_sms_cap !== undefined) row.daily_sms_cap = c.daily_sms_cap;
  if (c.forward_timeout_seconds !== undefined) row.forward_timeout_seconds = c.forward_timeout_seconds;
  return row;
};

type MissedCallWithVm = MissedCallRow & { voicemail_transcript?: string | null };

const callRowToLog = (r: MissedCallWithVm): CallLog => ({
  id: r.id,
  caller_number: r.caller_number,
  call_status: 'no-answer',
  received_at: r.called_at ?? new Date().toISOString(),
  voicemail: !!(r.voicemail_url || r.voicemail_transcript),
  voicemail_transcript: r.voicemail_transcript ?? null,
});

type MessageRowWithStatus = MessageRow & { status?: string | null };

const msgRowToLog = (r: MessageRowWithStatus): SmsLog => ({
  id: r.id,
  direction: r.direction === 'inbound' ? 'inbound' : 'outbound',
  to_number: r.direction === 'outbound' ? r.caller_number : '',
  from_number: r.direction === 'inbound' ? r.caller_number : '',
  body: r.body,
  status: r.direction === 'inbound' ? 'received' : (r.status || 'sent'),
  sent_at: r.sent_at ?? new Date().toISOString(),
  step: r.step_label ?? undefined,
});

let activityChannel: ReturnType<typeof supabase.channel> | null = null;

const DEMO_NUMBERS: PhoneNumber[] = [
  { number: '+1 (305) 555-0100', locality: 'Miami', region: 'FL', price: '$1.15/mo' },
  { number: '+1 (305) 555-0147', locality: 'Miami', region: 'FL', price: '$1.15/mo' },
  { number: '+1 (786) 555-0203', locality: 'Miami', region: 'FL', price: '$1.15/mo' },
  { number: '+1 (954) 555-0281', locality: 'Fort Lauderdale', region: 'FL', price: '$1.15/mo' },
  { number: '+1 (561) 555-0334', locality: 'Boca Raton', region: 'FL', price: '$1.15/mo' },
  { number: '+1 (407) 555-0412', locality: 'Orlando', region: 'FL', price: '$1.15/mo' },
  { number: '+1 (213) 555-0501', locality: 'Los Angeles', region: 'CA', price: '$1.15/mo' },
  { number: '+1 (312) 555-0617', locality: 'Chicago', region: 'IL', price: '$1.15/mo' },
  { number: '+1 (212) 555-0789', locality: 'New York', region: 'NY', price: '$1.15/mo' },
  { number: '+1 (713) 555-0832', locality: 'Houston', region: 'TX', price: '$1.15/mo' },
];

interface AppState {
  page: PageId;
  setPage: (p: PageId) => void;

  authMode: AuthMode;
  setAuthMode: (m: AuthMode) => void;

  // Onboarding
  obStep: number;
  setObStep: (s: number) => void;
  obForm: {
    name: string;
    business_type: string;
    avg_job_value: number;
    booking_link: string;
    google_review_link: string;
    sms_template: string;
    selectedPhoneNumber: string;
    forward_from_number: string;
    blackout_start: number;
    blackout_end: number;
    send_delay_seconds: number;
  };
  setObForm: (f: Partial<AppState['obForm']>) => void;

  // Dashboard
  clients: Client[];
  activeClientId: string;
  setActiveClientId: (id: string) => void;
  tab: TabId;
  setTab: (t: TabId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;

  callLogs: CallLog[];
  smsLog: SmsLog[];
  optOuts: string[];
  reviewsSent: Record<string, boolean>;
  replyTexts: Record<string, string>;
  vmailOpen: Record<string, boolean>;
  activityLoading: boolean;

  // Qualification flows
  qualFlows: QualificationFlow[];

  // Referrals
  referrals: Referral[];
  sendReferralRequest: (phone: string) => void;
  storeReferralResponse: (phone: string, name: string, referredPhone?: string) => void;

  // Modals
  showAddModal: boolean;
  setShowAddModal: (v: boolean) => void;
  confirmDel: { type: string; id: string; label: string } | null;
  setConfirmDel: (v: AppState['confirmDel']) => void;
  configSaved: boolean;

  // Actions
  addClient: (c: Omit<Client, 'id'>) => Promise<{ client: Client | null; error?: string }>;
  deleteClient: (id: string) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<{ error?: string }>;
  loadClients: () => Promise<void>;
  loadActivityForClient: (clientId: string) => Promise<void>;
  subscribeActivity: (clientId: string) => void;
  unsubscribeActivity: () => void;
  getActiveClient: () => Client;

  simulateCall: () => void;
  sendReply: (phone: string, text: string) => void;
  markDone: (phone: string) => void;
  stopSequence: (phone: string) => Promise<void>;

  deleteActivityItem: (id: string) => Promise<void>;
  clearAllActivity: () => Promise<void>;
  deleteConversation: (phone: string) => Promise<void>;
  clearAllInbox: () => Promise<void>;
  executeDel: () => void;

  toggleVmail: (id: string) => void;
  setReplyText: (phone: string, text: string) => void;

  // Phone search
  phoneResults: PhoneNumber[];
  phoneSearching: boolean;
  searchPhoneNumbers: (query: string) => void;

}

export const useAppStore = create<AppState>()(persist((set, get) => ({
  page: 'auth',
  setPage: (p) => set({ page: p }),

  authMode: 'signin',
  setAuthMode: (m) => set({ authMode: m }),

  obStep: 0,
  setObStep: (s) => set({ obStep: s }),
  obForm: {
    name: '',
    business_type: 'plumbing',
    avg_job_value: 300,
    booking_link: '',
    google_review_link: '',
    sms_template: "Hey, {business_name} here — sorry we missed you! Book a time: {booking_link}. Reply STOP.",
    selectedPhoneNumber: '',
    forward_from_number: '',
    blackout_start: 22,
    blackout_end: 7,
    send_delay_seconds: 5,
  },
  setObForm: (f) => set((s) => ({ obForm: { ...s.obForm, ...f } })),

  clients: [],
  activeClientId: '',
  setActiveClientId: (id) => set({ activeClientId: id, tab: 'activity', mobileMenuOpen: false }),
  tab: 'activity',
  setTab: (t) => set({ tab: t, configSaved: false }),
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  mobileMenuOpen: false,
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),

  callLogs: [],
  smsLog: [],
  optOuts: [],
  reviewsSent: {},
  replyTexts: {},
  vmailOpen: {},
  activityLoading: false,
  qualFlows: [],
  referrals: [],

  showAddModal: false,
  setShowAddModal: (v) => set({ showAddModal: v }),
  confirmDel: null,
  setConfirmDel: (v) => set({ confirmDel: v }),
  configSaved: false,

  loadActivityForClient: async (clientId: string) => {
    if (!clientId) { set({ callLogs: [], smsLog: [], optOuts: [], activityLoading: false }); return; }
    set({ activityLoading: true });
    try {
      const [calls, msgs] = await Promise.all([
        supabase.from('missed_calls').select('*').eq('client_id', clientId).order('called_at', { ascending: false }).limit(200),
        supabase.from('messages').select('*').eq('client_id', clientId).order('sent_at', { ascending: true }).limit(500),
      ]);
      if (calls.error) console.error('loadActivityForClient calls', calls.error);
      if (msgs.error) console.error('loadActivityForClient messages', msgs.error);
      const smsLog = ((msgs.data ?? []) as MessageRowWithStatus[]).map(msgRowToLog);
      const optOuts = Array.from(new Set(
        smsLog.filter(m => m.direction === 'inbound' && isStopKeyword(m.body)).map(m => m.from_number)
      ));
      set({
        callLogs: ((calls.data ?? []) as MissedCallWithVm[]).map(callRowToLog),
        smsLog,
        optOuts,
      });
    } finally {
      set({ activityLoading: false });
    }
  },

  subscribeActivity: (clientId: string) => {
    get().unsubscribeActivity();
    if (!clientId) return;
    activityChannel = supabase
      .channel(`activity-${clientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'missed_calls', filter: `client_id=eq.${clientId}` },
        (payload) => {
          const log = callRowToLog(payload.new as MissedCallWithVm);
          set((s) => s.callLogs.find(c => c.id === log.id) ? {} : { callLogs: [log, ...s.callLogs] });
          // Browser notification on new missed call
          try {
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('New missed call', { body: `From ${log.caller_number}`, icon: '/icon-192.png', tag: 'missed-call' });
            }
          } catch {}
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` },
        (payload) => {
          const log = msgRowToLog(payload.new as MessageRowWithStatus);
          set((s) => {
            if (s.smsLog.find(m => m.id === log.id)) return {};
            const next: Partial<AppState> = { smsLog: [...s.smsLog, log] };
            if (log.direction === 'inbound' && isStopKeyword(log.body) && !s.optOuts.includes(log.from_number)) {
              next.optOuts = [...s.optOuts, log.from_number];
            }
            return next;
          });
          if (log.direction === 'inbound') {
            try {
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('New SMS reply', { body: `${log.from_number}: ${log.body.slice(0, 80)}`, icon: '/icon-192.png', tag: `sms-${log.from_number}` });
              }
            } catch {}
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` },
        (payload) => {
          const updated = msgRowToLog(payload.new as MessageRowWithStatus);
          set((s) => ({
            smsLog: s.smsLog.map(m => m.id === updated.id ? { ...m, status: updated.status } : m),
          }));
        })
      .subscribe();
  },

  unsubscribeActivity: () => {
    if (activityChannel) {
      supabase.removeChannel(activityChannel);
      activityChannel = null;
    }
  },

  loadClients: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { set({ clients: [], activeClientId: '' }); return; }
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: true });
    if (error) { console.error('loadClients', error); return; }
    const clients = (data ?? []).map(rowToClient);
    set((s) => ({
      clients,
      activeClientId: clients.find(c => c.id === s.activeClientId)?.id || clients[0]?.id || '',
    }));
  },

  addClient: async (c) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { client: null, error: 'Not signed in.' };
    const wantedNumber = c.twilio_phone_number;
    const initialRow: ClientInsert = {
      ...clientToRow({ ...c, twilio_phone_number: '' }),
      business_name: c.name,
      owner_id: session.user.id,
    };
    const { data, error } = await supabase
      .from('clients')
      .insert(initialRow)
      .select()
      .single();
    if (error) { console.error('addClient', error); return { client: null, error: error.message || 'Could not save client.' }; }
    let newClient = rowToClient(data);
    if (wantedNumber) {
      const { data: buy, error: buyErr } = await supabase.functions.invoke('twilio-buy-number', {
        body: { phoneNumber: wantedNumber, clientId: newClient.id },
      });
      const twilioErr = buyErr?.message || buy?.error;
      if (twilioErr) {
        console.error('twilio-buy-number', twilioErr);
        await supabase.from('clients').delete().eq('id', newClient.id);
        return { client: null, error: `Twilio: ${twilioErr}` };
      }
      newClient = { ...newClient, twilio_phone_number: buy.phoneNumber };
    }
    set((s) => ({
      clients: [...s.clients, newClient],
      activeClientId: newClient.id,
      showAddModal: false,
      tab: 'activity',
    }));
    // Fire-and-forget onboarding confirmation email
    supabase.functions.invoke('send-onboard-email', {
      body: {
        to: session.user.email,
        businessName: newClient.name,
        twilioNumber: newClient.twilio_phone_number,
        bookingLink: newClient.booking_link,
      },
    }).catch((e) => console.warn('send-onboard-email', e));
    return { client: newClient };
  },

  deleteClient: async (id) => {
    const client = get().clients.find(c => c.id === id);
    if (client?.twilio_number_sid) {
      try { await supabase.functions.invoke('twilio-release-number', { body: { numberSid: client.twilio_number_sid } }); }
      catch (e) { console.warn('twilio release failed', e); }
    }
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) { console.error('deleteClient', error); return; }
    set((s) => {
      const remaining = s.clients.filter(c => c.id !== id);
      if (remaining.length === 0) return { clients: [], page: 'onboard' as PageId, obStep: 0, activeClientId: '' };
      return { clients: remaining, activeClientId: remaining[0].id };
    });
  },

  updateClient: async (id, data) => {
    const { error } = await supabase
      .from('clients')
      .update(clientToRow(data))
      .eq('id', id);
    if (error) { console.error('updateClient', error); return { error: error.message || 'Update failed.' }; }
    set((s) => ({
      clients: s.clients.map(c => c.id === id ? { ...c, ...data } : c),
      configSaved: true,
    }));
    return {};
  },

  getActiveClient: () => {
    const s = get();
    return s.clients.find(c => c.id === s.activeClientId) || s.clients[0];
  },

  simulateCall: () => {
    // Simulation logic lives in src/lib/simulate.ts to keep production actions clean.
    import('@/lib/simulate').then(m => m.runSimulatedCall(get()));
  },

  sendReferralRequest: (phone: string) => {
    import('@/lib/simulate').then(m => m.runSimulatedReferralRequest(get(), phone));
  },

  storeReferralResponse: (phone: string, name: string, referredPhone?: string) => {
    const code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const c = get().getActiveClient();
    const referral: Referral = {
      id: crypto.randomUUID(),
      phone,
      referredName: name,
      referredPhone,
      trackingCode: code,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const confirmSms: SmsLog = {
      id: crypto.randomUUID(),
      direction: 'outbound',
      from_number: c.twilio_phone_number,
      to_number: phone,
      body: `Thanks! We'll reach out to ${name}. Your referral code is ${code} — we'll let you know when they book! 🎉`,
      status: 'sent',
      sent_at: new Date().toISOString(),
      step: 'referral',
    };
    set((s) => ({
      referrals: [...s.referrals, referral],
      smsLog: [...s.smsLog, confirmSms],
    }));
    supabase.from('referrals').insert({
      client_id: get().activeClientId,
      referrer_number: phone,
      referred_name: name,
      referral_code: code,
      status: 'pending',
    }).then(({ error }) => { if (error) console.warn('referral insert failed', error); });
  },

  sendReply: async (phone, text) => {
    if (!text.trim()) return;
    const c = get().getActiveClient();
    if (get().optOuts.includes(phone)) {
      const blocked: SmsLog = {
        id: crypto.randomUUID(),
        direction: 'outbound',
        from_number: c.twilio_phone_number,
        to_number: phone,
        body: '[SMS blocked — this number has opted out]',
        status: 'blocked',
        sent_at: new Date().toISOString(),
        step: 'blocked',
      };
      set((s) => ({
        smsLog: [...s.smsLog, blocked],
        replyTexts: { ...s.replyTexts, [phone]: '' },
      }));
      return;
    }
    const sms: SmsLog = {
      id: crypto.randomUUID(),
      direction: 'outbound',
      from_number: c.twilio_phone_number,
      to_number: phone,
      body: text.trim(),
      status: 'sent',
      sent_at: new Date().toISOString(),
      step: 'manual',
    };
    set((s) => ({
      smsLog: [...s.smsLog, sms],
      replyTexts: { ...s.replyTexts, [phone]: '' },
    }));
    const { error } = await supabase.functions.invoke('send-manual-sms', {
      body: { clientId: get().activeClientId, to: phone, body: text.trim() },
    });
    if (error) {
      toast.error('Failed to send message');
      set((s) => ({ smsLog: s.smsLog.filter(m => m.id !== sms.id) }));
    }
  },

  markDone: async (phone) => {
    const c = get().getActiveClient();
    if (!c.google_review_link) {
      toast.warning('Add a Google review link in Settings to use this feature.');
      return;
    }
    const msg = `Thanks for choosing ${c.name}! If we did a great job today, a quick Google review means the world to us: ${c.google_review_link}`;
    const sms: SmsLog = {
      id: crypto.randomUUID(),
      direction: 'outbound',
      from_number: c.twilio_phone_number,
      to_number: phone,
      body: msg,
      status: 'sent',
      sent_at: new Date().toISOString(),
      step: 'review',
    };
    set((s) => ({
      smsLog: [...s.smsLog, sms],
      reviewsSent: { ...s.reviewsSent, [phone]: true },
    }));
    const { error } = await supabase.functions.invoke('send-manual-sms', {
      body: { clientId: get().activeClientId, to: phone, body: msg },
    });
    if (error) {
      toast.error('Failed to send review request');
      set((s) => ({ smsLog: s.smsLog.filter(m => m.id !== sms.id) }));
    }
  },

  stopSequence: async (phone) => {
    const clientId = get().activeClientId;
    if (clientId) {
      await supabase.from('scheduled_messages')
        .delete()
        .eq('client_id', clientId)
        .eq('to_number', phone)
        .in('status', ['pending']);
    }
    set((s) => ({
      smsLog: s.smsLog.filter(m => !(m.direction === 'outbound' && m.to_number === phone && (m.step === 2 || m.step === 3))),
    }));
  },

  deleteActivityItem: async (id) => {
    const clientId = get().activeClientId;
    // Try to delete from both tables in parallel; whichever doesn't match is a no-op.
    if (clientId) {
      await Promise.all([
        supabase.from('missed_calls').delete().eq('client_id', clientId).eq('id', id),
        supabase.from('messages').delete().eq('client_id', clientId).eq('id', id),
      ]);
    }
    set((s) => ({
      callLogs: s.callLogs.filter(c => c.id !== id),
      smsLog: s.smsLog.filter(sm => sm.id !== id),
    }));
  },

  clearAllActivity: async () => {
    const clientId = get().activeClientId;
    if (clientId) {
      await Promise.all([
        supabase.from('missed_calls').delete().eq('client_id', clientId),
        supabase.from('messages').delete().eq('client_id', clientId),
      ]);
    }
    set({ callLogs: [], smsLog: [], reviewsSent: {}, qualFlows: [], referrals: [] });
  },

  deleteConversation: async (phone) => {
    const clientId = get().activeClientId;
    if (clientId) {
      await supabase.from('messages').delete().eq('client_id', clientId).eq('caller_number', phone);
    }
    set((s) => ({
      smsLog: s.smsLog.filter(m => m.from_number !== phone && m.to_number !== phone),
      reviewsSent: { ...s.reviewsSent, [phone]: false },
      replyTexts: { ...s.replyTexts, [phone]: '' },
      qualFlows: s.qualFlows.filter(q => q.phone !== phone),
    }));
  },

  clearAllInbox: async () => {
    const clientId = get().activeClientId;
    if (clientId) {
      await supabase.from('messages').delete().eq('client_id', clientId);
    }
    set({ smsLog: [], reviewsSent: {}, replyTexts: {}, qualFlows: [], referrals: [] });
  },

  executeDel: () => {
    const d = get().confirmDel;
    if (!d) return;
    set({ confirmDel: null });
    if (d.type === 'feed-item') get().deleteActivityItem(d.id);
    else if (d.type === 'activity') get().clearAllActivity();
    else if (d.type === 'convo') get().deleteConversation(d.id);
    else if (d.type === 'inbox') get().clearAllInbox();
    else if (d.type === 'client') get().deleteClient(d.id);
  },

  toggleVmail: (id) => set((s) => ({ vmailOpen: { ...s.vmailOpen, [id]: !s.vmailOpen[id] } })),
  setReplyText: (phone, text) => set((s) => ({ replyTexts: { ...s.replyTexts, [phone]: text } })),

  phoneResults: [],
  phoneSearching: false,
  searchPhoneNumbers: (query) => {
    set({ phoneSearching: true, phoneResults: [] });
    setTimeout(() => {
      const q = query.toLowerCase().replace(/\D/g, '').substring(0, 3);
      const qStr = query.toLowerCase();
      let results = DEMO_NUMBERS.filter(n =>
        (q && n.number.replace(/\D/g, '').substring(1, 4).startsWith(q)) ||
        n.locality.toLowerCase().includes(qStr) ||
        n.region.toLowerCase().includes(qStr) ||
        !query
      ).slice(0, 6);
      if (!results.length) results = DEMO_NUMBERS.slice(0, 4);
      set({ phoneSearching: false, phoneResults: results });
    }, 800);
  },
}), {
  name: 'respondfall-app',
  partialize: (s) => ({ activeClientId: s.activeClientId, sidebarOpen: s.sidebarOpen, tab: s.tab }),
}));

