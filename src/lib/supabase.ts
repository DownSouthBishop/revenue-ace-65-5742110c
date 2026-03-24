import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  Profile, Client, ClientInsert, ClientUpdate,
  CallLog, SMSMessage, OptOut, WebhookHealth,
  ClientAnalytics, SequenceRun, Job, ConversationThread
} from '../types'

// ── Client ───────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false, autoRefreshToken: false },
    })

// ── Demo mode flag ───────────────────────────────────────────
export const isDemoMode = !isConfigured

// ── Auth ─────────────────────────────────────────────────────
export const auth = {
  signIn: (email: string, password: string) => {
    if (isDemoMode) return Promise.resolve({ data: { session: null, user: null }, error: null } as any)
    return supabase.auth.signInWithPassword({ email, password })
  },

  signUp: (email: string, password: string, fullName: string) => {
    if (isDemoMode) return Promise.resolve({ data: { session: null, user: null }, error: null } as any)
    return supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
  },

  magicLink: (email: string) => {
    if (isDemoMode) return Promise.resolve({ data: {}, error: null } as any)
    return supabase.auth.signInWithOtp({ email })
  },

  signOut: () => {
    if (isDemoMode) return Promise.resolve({ error: null })
    return supabase.auth.signOut()
  },

  getSession: () => {
    if (isDemoMode) return Promise.resolve({ data: { session: null }, error: null } as any)
    return supabase.auth.getSession()
  },

  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) => {
    if (isDemoMode) return { data: { subscription: { unsubscribe: () => {} } } } as any
    return supabase.auth.onAuthStateChange(cb)
  },
}

// ── Profiles ─────────────────────────────────────────────────
export const profiles = {
  get: async (userId: string): Promise<Profile | null> => {
    if (isDemoMode) return null
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) { console.error('profiles.get', error); return null }
    return data
  },
  update: async (userId: string, updates: Partial<Profile>) => {
    if (isDemoMode) return updates
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single()
    if (error) throw error
    return data
  },
}

// ── Demo data ────────────────────────────────────────────────
const DEMO_CLIENTS: Client[] = [
  {
    id: 'c1', owner_id: 'demo', name: 'Miami Plumbing Co.', business_type: 'plumbing',
    twilio_phone_number: '+13055550100', forward_from_number: '+13055559999',
    sms_template: "Hey, {business_name} here — sorry we missed your call! Book a time: {booking_link}. Reply STOP.",
    avg_job_value: 300, blackout_start: 22, blackout_end: 7, send_delay_seconds: 5,
    booking_link: 'https://cal.com/miamiplumbing', google_review_link: 'https://g.page/r/abc/review',
    is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'c2', owner_id: 'demo', name: 'South Beach HVAC', business_type: 'hvac',
    twilio_phone_number: '+17865550203', forward_from_number: '',
    sms_template: "Hi! {business_name} missed your call — book here: {booking_link}. Reply STOP.",
    avg_job_value: 450, blackout_start: 21, blackout_end: 8, send_delay_seconds: 3,
    booking_link: 'https://cal.com/sbhvac', google_review_link: '',
    is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]

let demoClients = [...DEMO_CLIENTS]
let demoCallLogs: CallLog[] = [
  { id: 'cl1', client_id: 'c1', caller_number: '+17865550123', call_status: 'no-answer', twilio_call_sid: null, voicemail_url: null, voicemail_transcript: "Hi, this is Carlos. I have a pretty bad leak under my kitchen sink. Can someone come out today?", received_at: new Date(Date.now() - 180000).toISOString() },
  { id: 'cl2', client_id: 'c1', caller_number: '+13055550891', call_status: 'no-answer', twilio_call_sid: null, voicemail_url: null, voicemail_transcript: null, received_at: new Date(Date.now() - 420000).toISOString() },
  { id: 'cl3', client_id: 'c1', caller_number: '+17865550247', call_status: 'busy', twilio_call_sid: null, voicemail_url: null, voicemail_transcript: "Hey, I'm calling about getting a quote for a bathroom remodel. Please call me back.", received_at: new Date(Date.now() - 1200000).toISOString() },
]
let demoSmsLog: SMSMessage[] = [
  { id: 's1', client_id: 'c1', direction: 'outbound', to_number: '+17865550123', from_number: '+13055550100', body: "Hey, Miami Plumbing Co. here — sorry we missed you! Book here: https://cal.com/miamiplumbing. Reply STOP.", status: 'delivered', sent_at: new Date(Date.now() - 175000).toISOString(), sequence_step: 1, intent: null, twilio_message_sid: null },
  { id: 's2', client_id: 'c1', direction: 'inbound', from_number: '+17865550123', to_number: '+13055550100', body: "Hi! I have a burst pipe under the sink — pretty urgent. Can someone come today?", status: 'received', sent_at: new Date(Date.now() - 120000).toISOString(), intent: 'emergency', sequence_step: null, twilio_message_sid: null },
  { id: 's3', client_id: 'c1', direction: 'outbound', to_number: '+17865550123', from_number: '+13055550100', body: "Burst pipe is our top priority — we treat this as an emergency. Our tech can be there by 2pm today.", status: 'sent', sent_at: new Date(Date.now() - 115000).toISOString(), sequence_step: 'ai', intent: null, twilio_message_sid: null },
  { id: 's4', client_id: 'c1', direction: 'inbound', from_number: '+17865550123', to_number: '+13055550100', body: "Yes! 2pm is perfect, thank you so much!", status: 'received', sent_at: new Date(Date.now() - 90000).toISOString(), intent: 'appointment', sequence_step: null, twilio_message_sid: null },
  { id: 's5', client_id: 'c1', direction: 'outbound', to_number: '+13055550891', from_number: '+13055550100', body: "Hey, Miami Plumbing Co. here — sorry we missed you! Book: https://cal.com/miamiplumbing. Reply STOP.", status: 'delivered', sent_at: new Date(Date.now() - 415000).toISOString(), sequence_step: 1, intent: null, twilio_message_sid: null },
]

// ── Clients ──────────────────────────────────────────────────
export const clients = {
  list: async (): Promise<Client[]> => {
    if (isDemoMode) return demoClients.filter(c => c.is_active)
    const { data, error } = await supabase.from('clients').select('*').eq('is_active', true).order('created_at', { ascending: true })
    if (error) { console.error('clients.list', error); return [] }
    return data || []
  },
  get: async (id: string): Promise<Client | null> => {
    if (isDemoMode) return demoClients.find(c => c.id === id) || null
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
    if (error) { console.error('clients.get', error); return null }
    return data
  },
  create: async (insert: ClientInsert): Promise<Client> => {
    const newClient: Client = { ...insert, id: 'c' + Date.now(), owner_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    if (isDemoMode) { demoClients.push(newClient); return newClient }
    const { data, error } = await supabase.from('clients').insert(insert).select().single()
    if (error) throw error
    return data
  },
  update: async (id: string, updates: ClientUpdate): Promise<Client> => {
    if (isDemoMode) {
      demoClients = demoClients.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c)
      return demoClients.find(c => c.id === id)!
    }
    const { data, error } = await supabase.from('clients').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  deactivate: async (id: string) => {
    if (isDemoMode) { demoClients = demoClients.filter(c => c.id !== id); return }
    const { error } = await supabase.from('clients').update({ is_active: false }).eq('id', id)
    if (error) throw error
  },
}

// ── Call Logs ────────────────────────────────────────────────
export const callLogs = {
  list: async (clientId: string, limit = 50): Promise<CallLog[]> => {
    if (isDemoMode) return demoCallLogs.filter(c => c.client_id === clientId).slice(0, limit)
    const { data, error } = await supabase.from('call_logs').select('*').eq('client_id', clientId).order('received_at', { ascending: false }).limit(limit)
    if (error) { console.error('callLogs.list', error); return [] }
    return data || []
  },
  subscribe: (clientId: string, cb: (log: CallLog) => void) => {
    if (isDemoMode) return { unsubscribe: () => {} } as any
    return supabase.channel(`call_logs:${clientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_logs', filter: `client_id=eq.${clientId}` }, payload => cb(payload.new as CallLog))
      .subscribe()
  },
}

// ── SMS Log ──────────────────────────────────────────────────
export const smsLog = {
  list: async (clientId: string, limit = 100): Promise<SMSMessage[]> => {
    if (isDemoMode) return demoSmsLog.filter(s => s.client_id === clientId).slice(0, limit)
    const { data, error } = await supabase.from('sms_log').select('*').eq('client_id', clientId).order('sent_at', { ascending: false }).limit(limit)
    if (error) { console.error('smsLog.list', error); return [] }
    return data || []
  },
  send: async (clientId: string, toNumber: string, body: string): Promise<void> => {
    if (isDemoMode) return
    const { error } = await supabase.functions.invoke('send-manual-sms', { body: { clientId, toNumber, body } })
    if (error) throw error
  },
  subscribe: (clientId: string, cb: (msg: SMSMessage) => void) => {
    if (isDemoMode) return { unsubscribe: () => {} } as any
    return supabase.channel(`sms_log:${clientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sms_log', filter: `client_id=eq.${clientId}` }, payload => cb(payload.new as SMSMessage))
      .subscribe()
  },
}

// ── Conversations ─────────────────────────────────────────────
export const conversations = {
  getThreads: (messages: SMSMessage[], optOuts: OptOut[], sequenceRuns: SequenceRun[]): ConversationThread[] => {
    const threads: Record<string, ConversationThread> = {}
    const optOutSet = new Set(optOuts.map(o => o.phone_number))
    const activeSeqs = new Set(sequenceRuns.filter(s => s.status === 'running').map(s => s.caller_number))
    messages.forEach(m => {
      const phone = m.direction === 'inbound' ? m.from_number : m.to_number
      if (!threads[phone]) {
        threads[phone] = { phone, messages: [], last_at: m.sent_at, has_inbound: false, intents: [], is_opted_out: optOutSet.has(phone), sequence_active: activeSeqs.has(phone) }
      }
      threads[phone].messages.push(m)
      if (m.sent_at > threads[phone].last_at) threads[phone].last_at = m.sent_at
      if (m.direction === 'inbound') threads[phone].has_inbound = true
      if (m.intent && !threads[phone].intents.includes(m.intent)) threads[phone].intents.push(m.intent)
    })
    return Object.values(threads).sort((a, b) => b.last_at.localeCompare(a.last_at))
  },
}

// ── Opt-Outs ─────────────────────────────────────────────────
export const optOuts = {
  list: async (clientId: string): Promise<OptOut[]> => {
    if (isDemoMode) return []
    const { data, error } = await supabase.from('opt_outs').select('*').eq('client_id', clientId).is('opted_back_in_at', null)
    if (error) { console.error('optOuts.list', error); return [] }
    return data || []
  },
}

// ── Sequence Runs ────────────────────────────────────────────
export const sequenceRuns = {
  list: async (clientId: string): Promise<SequenceRun[]> => {
    if (isDemoMode) return []
    const { data, error } = await supabase.from('sequence_runs').select('*').eq('client_id', clientId).order('started_at', { ascending: false }).limit(100)
    if (error) { console.error('sequenceRuns.list', error); return [] }
    return data || []
  },
  stop: async (id: string) => {
    if (isDemoMode) return
    const { error } = await supabase.from('sequence_runs').update({ status: 'stopped', stopped_reason: 'manual' }).eq('id', id)
    if (error) throw error
  },
}

// ── Jobs ─────────────────────────────────────────────────────
export const jobs = {
  list: async (clientId: string): Promise<Job[]> => {
    if (isDemoMode) return []
    const { data, error } = await supabase.from('jobs').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    if (error) { console.error('jobs.list', error); return [] }
    return data || []
  },
  markComplete: async (jobId: string) => {
    if (isDemoMode) return
    const { error } = await supabase.functions.invoke('review-request', { body: { jobId } })
    if (error) throw error
  },
}

// ── Analytics ────────────────────────────────────────────────
export const analytics = {
  get: async (clientId: string): Promise<ClientAnalytics | null> => {
    if (isDemoMode) return { client_id: clientId, missed_today: 4, sms_today: 9, missed_7d: 12, sms_7d: 28, missed_30d: 38, sms_30d: 94, opt_outs_total: 1, revenue_protected_30d: 11400, conversion_rate: 0.34 }
    const { data, error } = await supabase.from('client_analytics').select('*').eq('client_id', clientId).single()
    if (error) { console.error('analytics.get', error); return null }
    return data
  },
}

// ── Webhook Health ────────────────────────────────────────────
export const webhookHealth = {
  get: async (clientId: string): Promise<WebhookHealth | null> => {
    if (isDemoMode) return { id: 'wh1', client_id: clientId, last_ping_at: new Date().toISOString(), last_success_at: new Date().toISOString(), last_error: null, consecutive_failures: 0 }
    const { data, error } = await supabase.from('webhook_health').select('*').eq('client_id', clientId).single()
    if (error) return null
    return data
  },
}

// ── Demo helpers (for simulate button) ───────────────────────
export const demoHelpers = {
  addCallLog: (log: CallLog) => { demoCallLogs = [log, ...demoCallLogs] },
  addSmsLog: (sms: SMSMessage) => { demoSmsLog = [sms, ...demoSmsLog] },
  deleteCallLog: (id: string) => { demoCallLogs = demoCallLogs.filter(c => c.id !== id) },
  deleteSmsLog: (id: string) => { demoSmsLog = demoSmsLog.filter(s => s.id !== id) },
  clearActivity: (clientId: string) => {
    demoCallLogs = demoCallLogs.filter(c => c.client_id !== clientId)
    demoSmsLog = demoSmsLog.filter(s => s.client_id !== clientId)
  },
}
