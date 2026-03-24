import type { Carrier, PhoneSource, PlanConfig, BusinessType } from '../types'

// ── SkyforgeAI Brand ─────────────────────────────────────────
export const BRAND = {
  name: 'SkyforgeAI',
  product: 'Respondfall AI',
  tagline: 'Missed call → AI-powered revenue recovery',
  url: 'https://skyforgeai.com',
  supportEmail: 'support@skyforgeai.com',
  colors: {
    blue: '#1e7fd4',
    blue2: '#0d5aa8',
    blue3: '#0a3d7a',
    ember: '#e8621a',
    ember2: '#c44810',
    silver: '#d4dde8',
    bg: '#05070d',
  },
} as const

// ── Default SMS Templates ────────────────────────────────────
export const DEFAULT_SMS_TEMPLATES: Record<BusinessType, string> = {
  plumbing:     "Hey, {business_name} here — sorry we missed your call! We'd love to help. Book a time that works: {booking_link}. Reply STOP to opt out.",
  hvac:         "Hi! {business_name} missed your call. AC or heating issue? We've got you. Book here: {booking_link}. Reply STOP.",
  electrical:   "Hey, {business_name} here — we missed you! Electrical issues can't wait. Book us here: {booking_link}. Reply STOP.",
  roofing:      "Hi! {business_name} missed your call. Roof concerns? We'll take care of it. Book a free inspection: {booking_link}. Reply STOP.",
  landscaping:  "Hey, {business_name} here — sorry we missed you! We'd love to help with your outdoor space. Book here: {booking_link}. Reply STOP.",
  cleaning:     "Hi! {business_name} missed your call. We'd love to get your space spotless. Book online: {booking_link}. Reply STOP.",
  auto_repair:  "Hey, {business_name} here — sorry we missed you! Car trouble? We've got you. Book your appointment: {booking_link}. Reply STOP.",
  restaurant:   "Hi! {business_name} missed your call. For reservations or inquiries, reach us or book at: {booking_link}. Reply STOP.",
  salon:        "Hey! {business_name} missed your call. We'd love to see you — book your appointment here: {booking_link}. Reply STOP.",
  real_estate:  "Hi, {business_name} here — we missed your call! Let's find your perfect property. Schedule a call: {booking_link}. Reply STOP.",
  medical:      "Hi, {business_name} missed your call. To schedule your appointment, please visit: {booking_link}. Reply STOP.",
  legal:        "Hi, {business_name} here — we missed your call. To schedule a consultation: {booking_link}. Reply STOP.",
  other:        "Hey, {business_name} here — sorry we missed you! We'd love to help. Book a time here: {booking_link}. Reply STOP.",
}

// ── Follow-up Sequence Templates ────────────────────────────
export const SEQUENCE_STEP2_TEMPLATE = "Hey, still hoping to connect — {business_name} has availability this week. Book anytime: {booking_link}"
export const SEQUENCE_STEP3_TEMPLATE = "Last check-in from {business_name} — we'd love to help. Book here when ready: {booking_link}. No worries if timing isn't right. Reply STOP to unsubscribe."
export const REVIEW_REQUEST_TEMPLATE = "Thanks for choosing {business_name}! If we did a great job today, a quick Google review means the world to us: {review_link} — only takes 30 seconds!"

// ── Sequence Delays ──────────────────────────────────────────
export const SEQUENCE_DELAYS = {
  step2HoursAfterStep1: 2,
  step3HoursAfterStep2: 22,  // 24hr total
  reviewHoursAfterJobComplete: 2,
} as const

// ── Carrier Forwarding Data ──────────────────────────────────
export const CARRIERS: Carrier[] = [
  {
    id: 'att',
    name: 'AT&T',
    code: '*61*+1XXXXXXXXXX*11*20#',
    disable: '##61#',
  },
  {
    id: 'tmobile',
    name: 'T-Mobile',
    code: '**61*+1XXXXXXXXXX#',
    disable: '##61#',
  },
  {
    id: 'verizon',
    name: 'Verizon',
    code: '*71+1XXXXXXXXXX',
    disable: '*73',
  },
  {
    id: 'other',
    name: 'Other Carrier',
    code: '**61*+1XXXXXXXXXX**30#',
    disable: '##61#',
  },
]

// ── Phone Sources ────────────────────────────────────────────
export const PHONE_SOURCES: PhoneSource[] = [
  { id: 'iphone',      label: 'iPhone',        icon: '🍎' },
  { id: 'android',     label: 'Android',       icon: '🤖' },
  { id: 'google',      label: 'Google Voice',  icon: '🔵' },
  { id: 'landline',    label: 'Landline / VoIP', icon: '☎️' },
  { id: 'ringcentral', label: 'RingCentral',   icon: '📞' },
  { id: 'openphone',   label: 'OpenPhone',     icon: '📱' },
]

// ── TCPA Stop Words ──────────────────────────────────────────
export const STOP_WORDS = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']
export const START_WORDS = ['START', 'UNSTOP', 'YES']

// ── Business Types ───────────────────────────────────────────
export const BUSINESS_TYPES: Array<{ value: BusinessType; label: string }> = [
  { value: 'plumbing',    label: 'Plumbing' },
  { value: 'hvac',        label: 'HVAC' },
  { value: 'electrical',  label: 'Electrical' },
  { value: 'roofing',     label: 'Roofing' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'cleaning',    label: 'Cleaning' },
  { value: 'auto_repair', label: 'Auto Repair' },
  { value: 'restaurant',  label: 'Restaurant' },
  { value: 'salon',       label: 'Salon / Beauty' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'medical',     label: 'Medical / Dental' },
  { value: 'legal',       label: 'Legal' },
  { value: 'other',       label: 'Other' },
]

// ── SMS Variables ────────────────────────────────────────────
export const SMS_VARIABLES = [
  { label: '{business_name}', description: 'Your business name' },
  { label: '{caller_number}', description: "Caller's phone number" },
  { label: '{time}',          description: 'Time of the missed call' },
  { label: '{booking_link}',  description: 'Your booking/calendar link' },
] as const

// ── Pricing Plans ────────────────────────────────────────────
export const PRICING_PLANS: PlanConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 197,
    clientLimit: 1,
    highlighted: false,
    features: [
      '1 business location',
      'Missed call → instant SMS',
      '3-touch follow-up sequence',
      'Two-way SMS inbox',
      'AI intent tagging',
      'TCPA compliant opt-outs',
      'Basic analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 497,
    clientLimit: 5,
    highlighted: true,
    features: [
      'Up to 5 business locations',
      'Everything in Starter',
      'Booking link integration',
      'Post-job Google review requests',
      'Weekly revenue recovery report',
      'Voicemail transcription (coming)',
      'Client-facing portal (coming)',
      'Priority support',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 997,
    clientLimit: 999,
    highlighted: false,
    features: [
      'Unlimited client accounts',
      'Everything in Pro',
      'White-label client portal',
      'Agency billing dashboard',
      'Bulk client onboarding',
      'Dedicated account manager',
      'Custom SMS templates per client',
      'API access',
    ],
  },
]

// ── Webhook URL Builder ──────────────────────────────────────
export const buildWebhookURL = (clientId: string, type: 'missed-call' | 'inbound-sms') => {
  const base = import.meta.env.VITE_SUPABASE_URL
  return `${base}/functions/v1/${type}?clientId=${clientId}`
}

// ── Intent Labels & Colors ───────────────────────────────────
export const INTENT_CONFIG = {
  emergency:   { label: '🔴 Emergency',       className: 'bg-danger-bg text-danger border border-danger-border' },
  quote:       { label: '💬 Quote Request',    className: 'bg-sky-dim text-sky border border-sky-2/30' },
  appointment: { label: '📅 Appointment',      className: 'bg-ok-bg text-ok border border-ok-border' },
  info:        { label: 'ℹ️ Info Request',     className: 'bg-surface-2 text-txt-2 border border-border-sky' },
  general:     { label: '💼 General',          className: 'bg-ember-dim text-ember border border-border-ember' },
} as const
