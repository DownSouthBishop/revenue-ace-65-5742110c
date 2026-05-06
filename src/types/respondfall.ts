export interface Client {
  id: string;
  name: string;
  business_type: string;
  twilio_phone_number: string;
  forward_from_number: string;
  sms_template: string;
  avg_job_value: number;
  blackout_start: number;
  blackout_end: number;
  send_delay_seconds: number;
  booking_link: string;
  google_review_link: string;
  is_active: boolean;
  timezone?: string;
  daily_sms_cap?: number;
  forward_timeout_seconds?: number;
  twilio_number_sid?: string;
}


export interface CallLog {
  id: string;
  caller_number: string;
  call_status: string;
  received_at: string;
  voicemail: boolean;
  voicemail_transcript: string | null;
}

export interface SmsLog {
  id: string;
  direction: 'inbound' | 'outbound';
  to_number: string;
  from_number: string;
  body: string;
  status: string;
  sent_at: string;
  step?: number | string;
  intent?: string;
}

export interface PhoneNumber {
  number: string;
  locality: string;
  region: string;
  price: string;
}

export type QualReason = 'quote' | 'service' | 'question';
export type QualStage = 'awaiting_reason' | 'follow_up_1' | 'follow_up_2' | 'qualified' | 'routed';

export interface QualificationFlow {
  phone: string;
  stage: QualStage;
  reason?: QualReason;
  answers: string[];
  routedTo?: 'booking' | 'owner_notify';
  startedAt: string;
  completedAt?: string;
}

export interface Referral {
  id: string;
  phone: string;
  referredName: string;
  referredPhone?: string;
  trackingCode: string;
  status: 'pending' | 'contacted' | 'converted';
  createdAt: string;
}

export interface Conversation {
  phone: string;
  messages: SmsLog[];
  lastAt: string;
  hasInbound: boolean;
  intents: string[];
}

export type TabId = 'activity' | 'inbox' | 'sequences' | 'analytics' | 'referrals' | 'config' | 'connect';
export type PageId = 'auth' | 'onboard' | 'dashboard';
export type AuthMode = 'signin' | 'signup' | 'magic';
