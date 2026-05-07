import { describe, it, expect, beforeEach, vi } from 'vitest';

// Chainable Supabase mock
type ChainResult = { data: unknown[]; error: null };
interface MockChain extends PromiseLike<ChainResult> {
  select: () => MockChain;
  insert: () => MockChain;
  update: () => MockChain;
  delete: () => MockChain;
  eq: () => MockChain;
  in: () => MockChain;
  order: () => MockChain;
  limit: () => MockChain;
  maybeSingle: () => MockChain;
  single: () => MockChain;
}
const okThenable = (): MockChain => {
  const chain: MockChain = {
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
    then: <T>(resolve: (v: ChainResult) => T) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
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

import { isStopKeyword, STOP_KEYWORDS, useAppStore } from '@/store/appStore';
import type { Client, SmsLog } from '@/types/respondfall';

// ─── isStopKeyword ──────────────────────────────────────────────────────────

describe('isStopKeyword', () => {
  it('returns true for all STOP_KEYWORDS entries', () => {
    STOP_KEYWORDS.forEach((kw) => {
      expect(isStopKeyword(kw)).toBe(true);
    });
  });

  it('is case-insensitive', () => {
    expect(isStopKeyword('stop')).toBe(true);
    expect(isStopKeyword('Stop')).toBe(true);
    expect(isStopKeyword('STOP')).toBe(true);
  });

  it('trims whitespace before checking', () => {
    expect(isStopKeyword('  STOP  ')).toBe(true);
    expect(isStopKeyword('\tCANCEL\n')).toBe(true);
  });

  it('returns false for ordinary messages', () => {
    expect(isStopKeyword('hello')).toBe(false);
    expect(isStopKeyword('yes please')).toBe(false);
    expect(isStopKeyword('')).toBe(false);
    expect(isStopKeyword('stopwatch')).toBe(false);
  });
});

// ─── normalizePhone (via ReferralsTab logic, tested inline) ─────────────────

function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '');
  const e164 = /^\+?[1-9]\d{7,14}$/;
  if (!e164.test(digits)) return null;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

describe('normalizePhone', () => {
  it('accepts valid E.164 with country code', () => {
    expect(normalizePhone('+15551234567')).toBe('+15551234567');
  });

  it('prepends + when missing', () => {
    expect(normalizePhone('15551234567')).toBe('+15551234567');
  });

  it('strips formatting characters', () => {
    expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567');
  });

  it('rejects numbers that are too short', () => {
    expect(normalizePhone('12345')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(normalizePhone('')).toBeNull();
  });
});

// ─── opt-out flow ─────────────────────────────────────────────────────────────

const fakeClient: Client = {
  id: 'c1',
  name: 'Acme',
  business_type: 'plumbing',
  twilio_phone_number: '+15550000001',
  forward_from_number: '+15550000002',
  sms_template: 'hi',
  avg_job_value: 300,
  blackout_start: 22,
  blackout_end: 7,
  send_delay_seconds: 5,
  booking_link: '',
  google_review_link: '',
  is_active: true,
};

beforeEach(() => {
  useAppStore.setState({
    clients: [fakeClient],
    activeClientId: 'c1',
    callLogs: [],
    smsLog: [],
    optOuts: [],
    replyTexts: {},
    reviewsSent: {},
  });
});

describe('opt-out state', () => {
  it('sendReply is blocked when number is opted out', () => {
    useAppStore.setState({ optOuts: ['+15559998888'] });
    useAppStore.getState().sendReply('+15559998888', 'hello');
    const log = useAppStore.getState().smsLog;
    expect(log).toHaveLength(1);
    expect(log[0].status).toBe('blocked');
  });

  it('sendReply succeeds for a number not in optOuts', () => {
    useAppStore.getState().sendReply('+15557776666', 'on my way');
    const log = useAppStore.getState().smsLog;
    expect(log).toHaveLength(1);
    expect(log[0].direction).toBe('outbound');
    expect(log[0].status).toBe('sent');
  });

  it('detects opt-out from inbound STOP message', () => {
    const msgs: SmsLog[] = [
      {
        id: 'm1',
        direction: 'inbound',
        from_number: '+15554443333',
        to_number: '+1',
        body: 'STOP',
        status: 'received',
        sent_at: new Date().toISOString(),
      },
      {
        id: 'm2',
        direction: 'outbound',
        from_number: '+1',
        to_number: '+15554443333',
        body: 'hi',
        status: 'sent',
        sent_at: new Date().toISOString(),
      },
    ];
    const optOuts = msgs
      .filter((m) => m.direction === 'inbound' && isStopKeyword(m.body))
      .map((m) => m.from_number);
    expect(optOuts).toEqual(['+15554443333']);
  });

  it('does not flag non-STOP inbound messages as opt-outs', () => {
    const msgs: SmsLog[] = [
      {
        id: 'm3',
        direction: 'inbound',
        from_number: '+15551112222',
        to_number: '+1',
        body: 'Is this available tomorrow?',
        status: 'received',
        sent_at: new Date().toISOString(),
      },
    ];
    const optOuts = msgs
      .filter((m) => m.direction === 'inbound' && isStopKeyword(m.body))
      .map((m) => m.from_number);
    expect(optOuts).toHaveLength(0);
  });
});

// ─── client store operations ─────────────────────────────────────────────────

describe('client store', () => {
  it('activeClient returns the client matching activeClientId', () => {
    const state = useAppStore.getState();
    const active = state.clients.find((c) => c.id === state.activeClientId);
    expect(active?.id).toBe('c1');
  });

  it('setState updates smsLog correctly', () => {
    const entry: SmsLog = {
      id: 'x1',
      direction: 'outbound',
      from_number: '+1',
      to_number: '+15550001111',
      body: 'test',
      status: 'sent',
      sent_at: new Date().toISOString(),
    };
    useAppStore.setState({ smsLog: [entry] });
    expect(useAppStore.getState().smsLog[0].id).toBe('x1');
  });

  it('deleteActivityItem removes a call log entry', async () => {
    useAppStore.setState({
      callLogs: [
        {
          id: 'call-99',
          caller_number: '+15550005555',
          call_status: 'no-answer',
          received_at: new Date().toISOString(),
          voicemail: false,
          voicemail_transcript: null,
        },
      ],
    });
    await useAppStore.getState().deleteActivityItem('call-99');
    expect(useAppStore.getState().callLogs).toHaveLength(0);
  });

  it('deleteActivityItem removes an sms log entry', async () => {
    useAppStore.setState({
      smsLog: [
        {
          id: 'sms-99',
          direction: 'outbound',
          from_number: '+1',
          to_number: '+15550005555',
          body: 'hey',
          status: 'sent',
          sent_at: new Date().toISOString(),
        },
      ],
    });
    await useAppStore.getState().deleteActivityItem('sms-99');
    expect(useAppStore.getState().smsLog).toHaveLength(0);
  });
});
