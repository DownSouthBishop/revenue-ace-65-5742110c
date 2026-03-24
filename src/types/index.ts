// ══════════════════════════════════════════════════════════════
// RESPONDFALL AI — DOMAIN TYPES
// SkyforgeAI Platform
// ══════════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string | null
  agency_name: string | null
  plan: 'starter' | 'pro' | 'agency'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

// ── Client ───────────────────────────────────────────────────
export type BusinessType =
  | 'plumbing' | 'hvac' | 'electrical' | 'roofing'
  | 'landscaping' | 'cleaning' | 'auto_repair'
  | 'restaurant' | 'salon' | 'real_estate'
  | 'medical' | 'legal' | 'other'

export interface Client {
  id: string
  owner_id: string
  name: string
  business_type: BusinessType
  twilio_phone_number: string
  forward_from_number: string | null
  sms_template: string
  avg_job_value: number
  blackout_start: number        // 0-23 hour
  blackout_end: number          // 0-23 hour
  send_delay_seconds: number    // delay before first SMS
  booking_link: string | null
  google_review_link: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ClientInsert = Omit<Client, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
export type ClientUpdate = Partial<ClientInsert>

// ── Calls ────────────────────────────────────────────────────
export type CallStatus = 'no-answer' | 'busy' | 'failed' | 'canceled'

export interface CallLog {
  id: string
  client_id: string
  caller_number: string
  call_status: CallStatus
  twilio_call_sid: string | null
  voicemail_url: string | null
  voicemail_transcript: string | null
  received_at: string
}

// ── SMS ──────────────────────────────────────────────────────
export type SMSDirection = 'inbound' | 'outbound'
export type SMSStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'received' | 'failed'
export type SequenceStep = 1 | 2 | 3 | 'ai' | 'manual' | 'review'

export type LeadIntent = 'emergency' | 'quote' | 'appointment' | 'info' | 'general'

export interface SMSMessage {
  id: string
  client_id: string
  direction: SMSDirection
  from_number: string
  to_number: string
  body: string
  twilio_message_sid: string | null
  status: SMSStatus
  sequence_step: SequenceStep | null
  intent: LeadIntent | null
  sent_at: string
}

// ── Sequences ────────────────────────────────────────────────
export interface SequenceRun {
  id: string
  client_id: string
  caller_number: string
  call_log_id: string
  status: 'running' | 'completed' | 'stopped' | 'opted_out'
  current_step: number
  next_step_at: string | null
  stopped_reason: 'replied' | 'opted_out' | 'manual' | null
  started_at: string
  updated_at: string
}

// ── Compliance ───────────────────────────────────────────────
export interface OptOut {
  id: string
  client_id: string
  phone_number: string
  opted_out_at: string
  opted_back_in_at: string | null
}

// ── Jobs ─────────────────────────────────────────────────────
export type JobStatus = 'lead' | 'booked' | 'completed' | 'lost'

export interface Job {
  id: string
  client_id: string
  caller_number: string
  status: JobStatus
  notes: string | null
  review_requested: boolean
  review_requested_at: string | null
  created_at: string
  updated_at: string
}

// ── Health ───────────────────────────────────────────────────
export interface WebhookHealth {
  id: string
  client_id: string
  last_ping_at: string | null
  last_success_at: string | null
  last_error: string | null
  consecutive_failures: number
}

// ── Analytics ────────────────────────────────────────────────
export interface ClientAnalytics {
  client_id: string
  missed_today: number
  sms_today: number
  missed_7d: number
  sms_7d: number
  missed_30d: number
  sms_30d: number
  opt_outs_total: number
  revenue_protected_30d: number  // missed_30d * avg_job_value
  conversion_rate: number        // sequences with inbound reply / total sequences
}

// ── Conversations ─────────────────────────────────────────────
export interface ConversationThread {
  phone: string
  messages: SMSMessage[]
  last_at: string
  has_inbound: boolean
  intents: LeadIntent[]
  is_opted_out: boolean
  sequence_active: boolean
}

// ── Onboarding ───────────────────────────────────────────────
export type OnboardingStep = 0 | 1 | 2

export interface OnboardingForm {
  name: string
  business_type: BusinessType
  avg_job_value: number
  twilio_phone_number: string
  forward_from_number: string
  sms_template: string
  blackout_start: number
  blackout_end: number
  send_delay_seconds: number
  booking_link: string
  google_review_link: string
}

// ── UI State ─────────────────────────────────────────────────
export type DashTab = 'activity' | 'inbox' | 'sequences' | 'analytics' | 'config' | 'connect'

export interface AppState {
  activeClientId: string | null
  sidebarOpen: boolean
  activeTab: DashTab
}

// ── Carrier Forwarding ───────────────────────────────────────
export type CarrierId = 'att' | 'tmobile' | 'verizon' | 'other'
export type SourceId = 'iphone' | 'android' | 'google' | 'landline' | 'ringcentral' | 'openphone'

export interface Carrier {
  id: CarrierId
  name: string
  code: string     // USSD enable code
  disable: string  // USSD disable code
}

export interface PhoneSource {
  id: SourceId
  label: string
  icon: string
}

// ── Stripe ───────────────────────────────────────────────────
export type PricingPlan = 'starter' | 'pro' | 'agency'

export interface PlanConfig {
  id: PricingPlan
  name: string
  price: number
  clientLimit: number
  features: string[]
  highlighted: boolean
}
