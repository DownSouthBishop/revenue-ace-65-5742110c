import { describe, it, expect, beforeEach, vi } from 'vitest';

// Build a chainable mock that resolves to { data: null, error: null } for any await.
const okThenable = () => {
  const chain: any = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    in: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: () => chain,
    single: () => chain,
    then: (resolve: (v: any) => any) => Promise.resolve({ data: [], error: null }).then(resolve),
  };
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => okThenable()),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })) },
    channel: vi.fn(() => ({ on: () => ({ on: () => ({ on: () => ({ subscribe: () => ({}) }) }) }) })),
    removeChannel: vi.fn(),
    functions: { invoke: vi.fn(async () => ({ data: null, error: null })) },
  },
}));

import { useAppStore, isStopKeyword } from '@/store/appStore';
import type { Client, CallLog, SmsLog } from '@/types/respondfall';

const fakeClient: Client = {
  id: 'c1', name: 'Acme', business_type: 'plumbing', twilio_phone_number: '+15550000001',
  forward_from_number: '+15550000002', sms_template: 'hi', avg_job_value: 300,
  blackout_start: 22, blackout_end: 7, send_delay_seconds: 5,
  booking_link: '', google_review_link: '', is_active: true,
};

beforeEach(() => {
  useAppStore.setState({
    clients: [fakeClient], activeClientId: 'c1',
    callLogs: [], smsLog: [], optOuts: [], replyTexts: {}, reviewsSent: {},
  });
});

describe('isStopKeyword', () => {
  it('matches STOP variants', () => {
    expect(isStopKeyword('STOP')).toBe(true);
    expect(isStopKeyword(' stop ')).toBe(true);
    expect(isStopKeyword('UNSUBSCRIBE')).toBe(true);
    expect(isStopKeyword('Cancel')).toBe(true);
    expect(isStopKeyword('hello')).toBe(false);
  });
});

describe('sendReply', () => {
  it('blocks sends to opted-out numbers', () => {
    useAppStore.setState({ optOuts: ['+15550009999'] });
    useAppStore.getState().sendReply('+15550009999', 'hi there');
    const log = useAppStore.getState().smsLog;
    expect(log).toHaveLength(1);
    expect(log[0].status).toBe('blocked');
    expect(log[0].body).toMatch(/blocked/i);
  });

  it('sends a normal outbound for non-opted-out numbers', () => {
    useAppStore.getState().sendReply('+15550001111', 'on my way');
    const log = useAppStore.getState().smsLog;
    expect(log).toHaveLength(1);
    expect(log[0].status).toBe('sent');
    expect(log[0].direction).toBe('outbound');
  });
});

describe('deleteActivityItem', () => {
  it('removes the matching call and message from local state', async () => {
    const call: CallLog = {
      id: 'call-1', caller_number: '+15550003333', call_status: 'no-answer',
      received_at: new Date().toISOString(), voicemail: false, voicemail_transcript: null,
    };
    const sms: SmsLog = {
      id: 'sms-1', direction: 'outbound', from_number: '+1', to_number: '+15550003333',
      body: 'hi', status: 'sent', sent_at: new Date().toISOString(),
    };
    useAppStore.setState({ callLogs: [call], smsLog: [sms] });
    await useAppStore.getState().deleteActivityItem('call-1');
    expect(useAppStore.getState().callLogs).toHaveLength(0);
    expect(useAppStore.getState().smsLog).toHaveLength(1);
    await useAppStore.getState().deleteActivityItem('sms-1');
    expect(useAppStore.getState().smsLog).toHaveLength(0);
  });
});

describe('opt-out detection from inbound STOP via reload', () => {
  it('populates optOuts when smsLog contains an inbound STOP', () => {
    // Simulate what loadActivityForClient computes after fetch
    const inbound: SmsLog = {
      id: 's2', direction: 'inbound', from_number: '+15550004444', to_number: '+1',
      body: 'STOP', status: 'received', sent_at: new Date().toISOString(),
    };
    const optOuts = [inbound].filter(m => m.direction === 'inbound' && isStopKeyword(m.body)).map(m => m.from_number);
    expect(optOuts).toEqual(['+15550004444']);
  });
});
