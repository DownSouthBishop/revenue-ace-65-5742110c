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

  // Qualification flows
  qualFlows: QualificationFlow[];
  handleCallerReply: (phone: string, text: string) => void;

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
  stopSequence: (phone: string) => void;

  deleteActivityItem: (id: string) => void;
  clearAllActivity: () => void;
  deleteConversation: (phone: string) => void;
  clearAllInbox: () => void;
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
  qualFlows: [],
  referrals: [],

  showAddModal: false,
  setShowAddModal: (v) => set({ showAddModal: v }),
  confirmDel: null,
  setConfirmDel: (v) => set({ confirmDel: v }),
  configSaved: false,

  loadActivityForClient: async (clientId: string) => {
    if (!clientId) { set({ callLogs: [], smsLog: [], optOuts: [] }); return; }
    const [calls, msgs] = await Promise.all([
      supabase.from('missed_calls').select('*').eq('client_id', clientId).order('called_at', { ascending: false }).limit(200),
      supabase.from('messages').select('*').eq('client_id', clientId).order('sent_at', { ascending: true }).limit(500),
    ]);
    if (calls.error) console.error('loadActivityForClient calls', calls.error);
    if (msgs.error) console.error('loadActivityForClient messages', msgs.error);
    const smsLog = (msgs.data ?? []).map(msgRowToLog);
    const optOuts = Array.from(new Set(
      smsLog.filter(m => m.direction === 'inbound' && isStopKeyword(m.body)).map(m => m.from_number)
    ));
    set({
      callLogs: (calls.data ?? []).map(callRowToLog),
      smsLog,
      optOuts,
    });
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
          const log = msgRowToLog(payload.new);
          set((s) => {
            if (s.smsLog.find(m => m.id === log.id)) return {};
            const next: any = { smsLog: [...s.smsLog, log] };
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
          const updated = msgRowToLog(payload.new);
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
    const initialRow = { ...clientToRow({ ...c, twilio_phone_number: '' }), owner_id: session.user.id };
    const { data, error } = await supabase
      .from('clients')
      .insert(initialRow as any)
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
    const nums = ['+17865550381', '+13055550492', '+17865550571', '+13055550634', '+17865550789'];
    const from = nums[Math.floor(Math.random() * nums.length)];
    const now = new Date().toISOString();
    const c = get().getActiveClient();
    const hasVmail = Math.random() > 0.45;
    const transcripts = [
      "Hi, I need a quote for my bathroom. The shower's been leaking for two weeks. Can someone come take a look?",
      "Hey, this is urgent — my water heater is making a strange noise and I think it might fail. Please call me back ASAP.",
      "I saw your reviews online and wanted to ask about your pricing for kitchen pipe replacement.",
      "Hi, calling about scheduling routine maintenance. Please give me a call back when you have a chance!",
    ];

    const newCall: CallLog = {
      id: 'cl' + Date.now(),
      caller_number: from,
      call_status: 'no-answer',
      received_at: now,
      voicemail: hasVmail,
      voicemail_transcript: hasVmail ? transcripts[Math.floor(Math.random() * transcripts.length)] : null,
    };

    set((s) => ({
      callLogs: [newCall, ...s.callLogs],
    }));

    // TCPA: do not send anything to opted-out numbers
    if (get().optOuts.includes(from)) {
      const blocked: SmsLog = {
        id: 's' + Date.now(),
        direction: 'outbound',
        from_number: c.twilio_phone_number,
        to_number: from,
        body: '[SMS blocked — this number has opted out]',
        status: 'blocked',
        sent_at: new Date().toISOString(),
        step: 'blocked',
      };
      set((s) => ({ smsLog: [...s.smsLog, blocked] }));
      return;
    }

    // Step 1: Initial auto-response
    const body = c.sms_template
      .replace(/{business_name}/g, c.name)
      .replace(/{caller_number}/g, from)
      .replace(/{time}/g, new Date().toLocaleTimeString())
      .replace(/{booking_link}/g, c.booking_link || 'https://cal.com/yourbiz');

    setTimeout(() => {
      const sms: SmsLog = {
        id: 's' + Date.now(),
        direction: 'outbound',
        from_number: c.twilio_phone_number,
        to_number: from,
        body,
        status: 'sent',
        sent_at: new Date().toISOString(),
        step: 1,
      };
      set((s) => ({
        smsLog: [sms, ...s.smsLog],
      }));

      // Step 2: Qualification prompt after auto-response
      setTimeout(() => {
        const qualSms: SmsLog = {
          id: 's' + Date.now(),
          direction: 'outbound',
          from_number: c.twilio_phone_number,
          to_number: from,
          body: `Quick question — what can we help with?\n\nReply with a number:\n1️⃣ Get a Quote\n2️⃣ Schedule Service\n3️⃣ Ask a Question`,
          status: 'sent',
          sent_at: new Date().toISOString(),
          step: 'qual',
        };
        const newFlow: QualificationFlow = {
          phone: from,
          stage: 'awaiting_reason',
          answers: [],
          startedAt: new Date().toISOString(),
        };
        set((s) => ({
          smsLog: [...s.smsLog, qualSms],
          qualFlows: [...s.qualFlows.filter(q => q.phone !== from), newFlow],
        }));

        // Simulate caller responding with a reason
        setTimeout(() => {
          const pick = (['1', '2', '3'] as const)[Math.floor(Math.random() * 3)];
          const reasonMap: Record<string, QualReason> = { '1': 'quote', '2': 'service', '3': 'question' };
          const reason = reasonMap[pick];
          const replyBody = pick === '1' ? "1" : pick === '2' ? "2" : "3";
          const callerReply: SmsLog = {
            id: 's' + Date.now(),
            direction: 'inbound',
            from_number: from,
            to_number: c.twilio_phone_number,
            body: replyBody,
            status: 'received',
            sent_at: new Date().toISOString(),
            intent: reason,
          };
          set((s) => ({ smsLog: [...s.smsLog, callerReply] }));
          get().handleCallerReply(from, replyBody);
        }, 3000);
      }, 2000);
    }, (c.send_delay_seconds || 5) * 200);
  },

  handleCallerReply: (phone: string, text: string) => {
    const c = get().getActiveClient();
    const flow = get().qualFlows.find(q => q.phone === phone);
    if (!flow) return;

    const t = text.trim().toLowerCase();

    if (flow.stage === 'awaiting_reason') {
      let reason: QualReason = 'question';
      if (t === '1' || t.includes('quote')) reason = 'quote';
      else if (t === '2' || t.includes('service') || t.includes('schedule')) reason = 'service';

      const followUp: Record<QualReason, string> = {
        quote: `Got it — we'll prepare a quote! What type of work do you need? (e.g., leak repair, remodel, installation)`,
        service: `We'd love to get you scheduled. What day/time works best this week?`,
        question: `Sure! Go ahead and type your question — we'll get back to you shortly.`,
      };

      const sms: SmsLog = {
        id: 's' + Date.now(),
        direction: 'outbound',
        from_number: c.twilio_phone_number,
        to_number: phone,
        body: followUp[reason],
        status: 'sent',
        sent_at: new Date().toISOString(),
        step: 'qual',
      };

      set((s) => ({
        smsLog: [...s.smsLog, sms],
        qualFlows: s.qualFlows.map(q =>
          q.phone === phone ? { ...q, stage: 'follow_up_1' as const, reason, answers: [...q.answers, text] } : q
        ),
      }));

      // Simulate follow-up response
      setTimeout(() => {
        const responses: Record<QualReason, string[]> = {
          quote: ["Kitchen sink leak — water damage starting under the cabinet", "Full bathroom remodel, two bathrooms", "Water heater replacement, current one is 15 years old"],
          service: ["Thursday afternoon works great", "Tomorrow morning if possible, before 10am", "Any day this week after 2pm"],
          question: ["Do you offer free estimates?", "What's your hourly rate for emergency calls?", "Are you licensed and insured?"],
        };
        const resp = responses[reason][Math.floor(Math.random() * responses[reason].length)];
        const reply: SmsLog = {
          id: 's' + Date.now(),
          direction: 'inbound',
          from_number: phone,
          to_number: c.twilio_phone_number,
          body: resp,
          status: 'received',
          sent_at: new Date().toISOString(),
          intent: reason,
        };
        set((s) => ({ smsLog: [...s.smsLog, reply] }));

        // Route based on reason
        setTimeout(() => {
          let routeMsg = '';
          let routedTo: 'booking' | 'owner_notify' = 'booking';

          if (reason === 'quote' || reason === 'service') {
            routeMsg = `Perfect, thanks for that info! Here's our booking link — pick whatever time works: ${c.booking_link || 'https://cal.com/yourbiz'}\n\nWe'll have a tech ready for you. 🔧`;
            routedTo = 'booking';
          } else {
            routeMsg = `Great question! We're forwarding this to our team — someone will text you back within 30 minutes. Thanks for your patience!`;
            routedTo = 'owner_notify';
          }

          const routeSms: SmsLog = {
            id: 's' + Date.now(),
            direction: 'outbound',
            from_number: c.twilio_phone_number,
            to_number: phone,
            body: routeMsg,
            status: 'sent',
            sent_at: new Date().toISOString(),
            step: 'qual',
          };

          set((s) => ({
            smsLog: [...s.smsLog, routeSms],
            qualFlows: s.qualFlows.map(q =>
              q.phone === phone
                ? { ...q, stage: 'routed' as const, routedTo, answers: [...q.answers, resp], completedAt: new Date().toISOString() }
                : q
            ),
          }));
        }, 1500);
      }, 2500);
    }
  },

  sendReferralRequest: (phone: string) => {
    const c = get().getActiveClient();
    const sms: SmsLog = {
      id: 's' + Date.now(),
      direction: 'outbound',
      from_number: c.twilio_phone_number,
      to_number: phone,
      body: `Glad we could help! 🙌 Know someone who could use our services? Reply with their name and we'll reach out — plus you'll get a referral reward!\n\nJust reply: [Name] [Phone]`,
      status: 'sent',
      sent_at: new Date().toISOString(),
      step: 'referral',
    };
    set((s) => ({
      smsLog: [...s.smsLog, sms],
    }));

    // Simulate referral response
    setTimeout(() => {
      const names = ['Maria Garcia', 'James Wilson', 'Diana Reyes', 'Robert Chen'];
      const phones = ['+17865550901', '+13055550822', '+17865550733', '+13055550644'];
      const idx = Math.floor(Math.random() * names.length);
      const reply: SmsLog = {
        id: 's' + Date.now(),
        direction: 'inbound',
        from_number: phone,
        to_number: c.twilio_phone_number,
        body: `${names[idx]} ${phones[idx]}`,
        status: 'received',
        sent_at: new Date().toISOString(),
        intent: 'referral',
      };
      set((s) => ({ smsLog: [...s.smsLog, reply] }));
      get().storeReferralResponse(phone, names[idx], phones[idx]);
    }, 3000);
  },

  storeReferralResponse: (phone: string, name: string, referredPhone?: string) => {
    const code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const c = get().getActiveClient();
    const referral: Referral = {
      id: 'ref' + Date.now(),
      phone,
      referredName: name,
      referredPhone: referredPhone,
      trackingCode: code,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const confirmSms: SmsLog = {
      id: 's' + Date.now(),
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
  },

  sendReply: (phone, text) => {
    if (!text.trim()) return;
    const c = get().getActiveClient();
    if (get().optOuts.includes(phone)) {
      const blocked: SmsLog = {
        id: 's' + Date.now(),
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
      id: 's' + Date.now(),
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

    // Check if this is a reply to a qualification flow
    const flow = get().qualFlows.find(q => q.phone === phone && q.stage !== 'routed');
    if (flow) {
      get().handleCallerReply(phone, text.trim());
      return;
    }

    setTimeout(() => {
      const rs = ["Got it! What time works best for a callback?", "Thanks — we'll call within the hour.", "Perfect, you're logged in. Our dispatcher will be in touch."];
      const reply: SmsLog = {
        id: 's' + Date.now(),
        direction: 'inbound',
        from_number: phone,
        to_number: c.twilio_phone_number,
        body: rs[Math.floor(Math.random() * rs.length)],
        status: 'received',
        sent_at: new Date().toISOString(),
        intent: 'general',
      };
      set((s) => ({ smsLog: [...s.smsLog, reply] }));
    }, 1500);
  },

  markDone: (phone) => {
    const c = get().getActiveClient();
    if (!c.google_review_link) {
      set({ tab: 'config' });
      return;
    }
    const msg = `Thanks for choosing ${c.name}! If we did a great job today, a quick Google review means the world to us: ${c.google_review_link}`;
    const sms: SmsLog = {
      id: 's' + Date.now(),
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
  },

  stopSequence: (phone) => set((s) => ({
    smsLog: s.smsLog.filter(m => !(m.direction === 'outbound' && m.to_number === phone && (m.step === 2 || m.step === 3))),
  })),

  deleteActivityItem: (id) => set((s) => ({
    callLogs: s.callLogs.filter(c => c.id !== id),
    smsLog: s.smsLog.filter(sm => sm.id !== id),
  })),
  clearAllActivity: () => set({ callLogs: [], smsLog: [], reviewsSent: {}, qualFlows: [], referrals: [] }),
  deleteConversation: (phone) => set((s) => ({
    smsLog: s.smsLog.filter(m => m.from_number !== phone && m.to_number !== phone),
    reviewsSent: { ...s.reviewsSent, [phone]: false },
    replyTexts: { ...s.replyTexts, [phone]: '' },
    qualFlows: s.qualFlows.filter(q => q.phone !== phone),
  })),
  clearAllInbox: () => set({ smsLog: [], reviewsSent: {}, replyTexts: {}, qualFlows: [], referrals: [] }),
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

