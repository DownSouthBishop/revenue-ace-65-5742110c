import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, CallLog, SmsLog, PhoneNumber, TabId, PageId, AuthMode, QualificationFlow, QualReason, Referral } from '@/types/respondfall';

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

  // Modals
  showAddModal: boolean;
  setShowAddModal: (v: boolean) => void;
  confirmDel: { type: string; id: string; label: string } | null;
  setConfirmDel: (v: AppState['confirmDel']) => void;
  configSaved: boolean;

  // Actions
  addClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
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

  // Cached stats (avoid random on re-render)
  dailyStats: { missed: number; smsSent: number };
  refreshDailyStats: () => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
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

  clients: [
    { id: 'c1', name: 'Miami Plumbing Co.', business_type: 'plumbing', twilio_phone_number: '+1 (305) 555-0100', forward_from_number: '+13055559999', sms_template: "Hey, {business_name} here — sorry we missed you! Book here: {booking_link}. Reply STOP.", avg_job_value: 300, blackout_start: 22, blackout_end: 7, send_delay_seconds: 5, booking_link: 'https://cal.com/miamiplumbing', google_review_link: 'https://g.page/r/abc/review', is_active: true },
    { id: 'c2', name: 'South Beach HVAC', business_type: 'hvac', twilio_phone_number: '+1 (786) 555-0203', forward_from_number: '', sms_template: "Hi! South Beach HVAC missed your call — book here: {booking_link}. Reply STOP.", avg_job_value: 450, blackout_start: 21, blackout_end: 8, send_delay_seconds: 3, booking_link: 'https://cal.com/sbhvac', google_review_link: '', is_active: true },
  ],
  activeClientId: 'c1',
  setActiveClientId: (id) => set({ activeClientId: id, tab: 'activity', mobileMenuOpen: false }),
  tab: 'activity',
  setTab: (t) => set({ tab: t, configSaved: false }),
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  mobileMenuOpen: false,
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),

  callLogs: [
    { id: 'cl1', caller_number: '+17865550123', call_status: 'no-answer', received_at: new Date(Date.now() - 180000).toISOString(), voicemail: true, voicemail_transcript: "Hi, this is Carlos from Coral Gables. I have a pretty bad leak under my kitchen sink — water's been dripping since this morning. Can someone come out today? It's getting worse. My number is 786-555-0123. Thanks." },
    { id: 'cl2', caller_number: '+13055550891', call_status: 'no-answer', received_at: new Date(Date.now() - 420000).toISOString(), voicemail: false, voicemail_transcript: null },
    { id: 'cl3', caller_number: '+17865550247', call_status: 'busy', received_at: new Date(Date.now() - 1200000).toISOString(), voicemail: true, voicemail_transcript: "Hey, I'm calling about getting a quote for a bathroom remodel. I've got two bathrooms that need new pipes and fixtures. Please call me back when you get a chance." },
  ],
  smsLog: [
    { id: 's1', direction: 'outbound', to_number: '+17865550123', from_number: '+13055550100', body: "Hey, Miami Plumbing Co. here — sorry we missed you! Book here: https://cal.com/miamiplumbing. Reply STOP.", status: 'delivered', sent_at: new Date(Date.now() - 175000).toISOString(), step: 1 },
    { id: 's2', direction: 'inbound', from_number: '+17865550123', to_number: '+13055550100', body: "Hi! I have a burst pipe under the sink — pretty urgent. Can someone come today?", status: 'received', sent_at: new Date(Date.now() - 120000).toISOString(), intent: 'emergency' },
    { id: 's3', direction: 'outbound', to_number: '+17865550123', from_number: '+13055550100', body: "Burst pipe is our top priority — we treat this as an emergency. Our tech can be there by 2pm today. Does that work for you?", status: 'sent', sent_at: new Date(Date.now() - 115000).toISOString(), step: 'ai' },
    { id: 's4', direction: 'inbound', from_number: '+17865550123', to_number: '+13055550100', body: "Yes! 2pm is perfect, thank you so much!", status: 'received', sent_at: new Date(Date.now() - 90000).toISOString(), intent: 'appointment' },
    { id: 's5', direction: 'outbound', to_number: '+13055550891', from_number: '+13055550100', body: "Hey, Miami Plumbing Co. here — sorry we missed you! Book: https://cal.com/miamiplumbing. Reply STOP.", status: 'delivered', sent_at: new Date(Date.now() - 415000).toISOString(), step: 1 },
    { id: 's6', direction: 'outbound', to_number: '+13055550891', from_number: '+13055550100', body: "Hey, still hoping to connect — Miami Plumbing Co. has availability this week. Book anytime: https://cal.com/miamiplumbing", status: 'delivered', sent_at: new Date(Date.now() - 280000).toISOString(), step: 2 },
  ],
  optOuts: [],
  reviewsSent: {},
  replyTexts: {},
  vmailOpen: {},
  showAddModal: false,
  setShowAddModal: (v) => set({ showAddModal: v }),
  confirmDel: null,
  setConfirmDel: (v) => set({ confirmDel: v }),
  configSaved: false,

  dailyStats: { missed: 4, smsSent: 9 },
  refreshDailyStats: () => set({ dailyStats: { missed: Math.floor(Math.random() * 5) + 2, smsSent: Math.floor(Math.random() * 8) + 5 } }),

  addClient: (c) => set((s) => ({ clients: [...s.clients, c], activeClientId: c.id, showAddModal: false, tab: 'activity' })),
  deleteClient: (id) => set((s) => {
    const remaining = s.clients.filter(c => c.id !== id);
    if (remaining.length === 0) return { clients: [], page: 'onboard' as PageId, obStep: 0 };
    return { clients: remaining, activeClientId: remaining[0].id };
  }),
  updateClient: (id, data) => set((s) => ({
    clients: s.clients.map(c => c.id === id ? { ...c, ...data } : c),
    configSaved: true,
  })),
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
      dailyStats: { ...s.dailyStats, missed: s.dailyStats.missed + 1 },
    }));

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
        dailyStats: { ...s.dailyStats, smsSent: s.dailyStats.smsSent + 1 },
      }));
    }, (c.send_delay_seconds || 5) * 200);
  },

  sendReply: (phone, text) => {
    if (!text.trim()) return;
    const c = get().getActiveClient();
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
  clearAllActivity: () => set({ callLogs: [], smsLog: [], reviewsSent: {} }),
  deleteConversation: (phone) => set((s) => ({
    smsLog: s.smsLog.filter(m => m.from_number !== phone && m.to_number !== phone),
    reviewsSent: { ...s.reviewsSent, [phone]: false },
    replyTexts: { ...s.replyTexts, [phone]: '' },
  })),
  clearAllInbox: () => set({ smsLog: [], reviewsSent: {}, replyTexts: {} }),
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
}));
