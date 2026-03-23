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

export interface Conversation {
  phone: string;
  messages: SmsLog[];
  lastAt: string;
  hasInbound: boolean;
  intents: string[];
}

export type TabId = 'activity' | 'inbox' | 'sequences' | 'analytics' | 'config' | 'connect';
export type PageId = 'auth' | 'onboard' | 'dashboard';
export type AuthMode = 'signin' | 'signup' | 'magic';
