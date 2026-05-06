import { useAppStore } from '@/store/appStore';
import type { CallLog, SmsLog, QualificationFlow, QualReason, Referral } from '@/types/respondfall';

type Store = ReturnType<typeof useAppStore.getState>;

const uid = () => crypto.randomUUID();

/** Simulation-only: injects a fake missed call + automated sequence + fake caller replies. */
export function runSimulatedCall(store: Store) {
  const c = store.getActiveClient();
  if (!c) return;

  const nums = ['+17865550381', '+13055550492', '+17865550571', '+13055550634', '+17865550789'];
  const from = nums[Math.floor(Math.random() * nums.length)];
  const now = new Date().toISOString();
  const hasVmail = Math.random() > 0.45;
  const transcripts = [
    "Hi, I need a quote for my bathroom. The shower's been leaking for two weeks. Can someone come take a look?",
    "Hey, this is urgent — my water heater is making a strange noise and I think it might fail. Please call me back ASAP.",
    "I saw your reviews online and wanted to ask about your pricing for kitchen pipe replacement.",
    "Hi, calling about scheduling routine maintenance. Please give me a call back when you have a chance!",
  ];

  const newCall: CallLog = {
    id: uid(),
    caller_number: from,
    call_status: 'no-answer',
    received_at: now,
    voicemail: hasVmail,
    voicemail_transcript: hasVmail ? transcripts[Math.floor(Math.random() * transcripts.length)] : null,
  };

  useAppStore.setState((s) => ({ callLogs: [newCall, ...s.callLogs] }));

  if (useAppStore.getState().optOuts.includes(from)) {
    const blocked: SmsLog = {
      id: uid(), direction: 'outbound', from_number: c.twilio_phone_number, to_number: from,
      body: '[SMS blocked — this number has opted out]', status: 'blocked',
      sent_at: new Date().toISOString(), step: 'blocked',
    };
    useAppStore.setState((s) => ({ smsLog: [...s.smsLog, blocked] }));
    return;
  }

  const body = c.sms_template
    .replace(/{business_name}/g, c.name)
    .replace(/{caller_number}/g, from)
    .replace(/{time}/g, new Date().toLocaleTimeString())
    .replace(/{booking_link}/g, c.booking_link || 'https://cal.com/yourbiz');

  setTimeout(() => {
    const sms: SmsLog = {
      id: uid(), direction: 'outbound', from_number: c.twilio_phone_number, to_number: from,
      body, status: 'sent', sent_at: new Date().toISOString(), step: 1,
    };
    useAppStore.setState((s) => ({ smsLog: [sms, ...s.smsLog] }));

    setTimeout(() => {
      const qualSms: SmsLog = {
        id: uid(), direction: 'outbound', from_number: c.twilio_phone_number, to_number: from,
        body: `Quick question — what can we help with?\n\nReply with a number:\n1️⃣ Get a Quote\n2️⃣ Schedule Service\n3️⃣ Ask a Question`,
        status: 'sent', sent_at: new Date().toISOString(), step: 'qual',
      };
      const newFlow: QualificationFlow = {
        phone: from, stage: 'awaiting_reason', answers: [], startedAt: new Date().toISOString(),
      };
      useAppStore.setState((s) => ({
        smsLog: [...s.smsLog, qualSms],
        qualFlows: [...s.qualFlows.filter(q => q.phone !== from), newFlow],
      }));

      setTimeout(() => {
        const pick = (['1', '2', '3'] as const)[Math.floor(Math.random() * 3)];
        const reasonMap: Record<string, QualReason> = { '1': 'quote', '2': 'service', '3': 'question' };
        const reason = reasonMap[pick];
        const callerReply: SmsLog = {
          id: uid(), direction: 'inbound', from_number: from, to_number: c.twilio_phone_number,
          body: pick, status: 'received', sent_at: new Date().toISOString(), intent: reason,
        };
        useAppStore.setState((s) => ({ smsLog: [...s.smsLog, callerReply] }));
        runSimulatedQualReply(useAppStore.getState(), from, pick);
      }, 3000);
    }, 2000);
  }, (c.send_delay_seconds || 5) * 200);
}

function runSimulatedQualReply(store: Store, phone: string, text: string) {
  const c = store.getActiveClient();
  const flow = store.qualFlows.find(q => q.phone === phone);
  if (!flow) return;

  const t = text.trim().toLowerCase();
  let reason: QualReason = 'question';
  if (t === '1' || t.includes('quote')) reason = 'quote';
  else if (t === '2' || t.includes('service') || t.includes('schedule')) reason = 'service';

  const followUp: Record<QualReason, string> = {
    quote: `Got it — we'll prepare a quote! What type of work do you need? (e.g., leak repair, remodel, installation)`,
    service: `We'd love to get you scheduled. What day/time works best this week?`,
    question: `Sure! Go ahead and type your question — we'll get back to you shortly.`,
  };

  const sms: SmsLog = {
    id: uid(), direction: 'outbound', from_number: c.twilio_phone_number, to_number: phone,
    body: followUp[reason], status: 'sent', sent_at: new Date().toISOString(), step: 'qual',
  };
  useAppStore.setState((s) => ({
    smsLog: [...s.smsLog, sms],
    qualFlows: s.qualFlows.map(q => q.phone === phone
      ? { ...q, stage: 'follow_up_1' as const, reason, answers: [...q.answers, text] } : q),
  }));

  setTimeout(() => {
    const responses: Record<QualReason, string[]> = {
      quote: ["Kitchen sink leak — water damage starting under the cabinet", "Full bathroom remodel, two bathrooms", "Water heater replacement, current one is 15 years old"],
      service: ["Thursday afternoon works great", "Tomorrow morning if possible, before 10am", "Any day this week after 2pm"],
      question: ["Do you offer free estimates?", "What's your hourly rate for emergency calls?", "Are you licensed and insured?"],
    };
    const resp = responses[reason][Math.floor(Math.random() * responses[reason].length)];
    const reply: SmsLog = {
      id: uid(), direction: 'inbound', from_number: phone, to_number: c.twilio_phone_number,
      body: resp, status: 'received', sent_at: new Date().toISOString(), intent: reason,
    };
    useAppStore.setState((s) => ({ smsLog: [...s.smsLog, reply] }));

    setTimeout(() => {
      let routeMsg = '';
      let routedTo: 'booking' | 'owner_notify' = 'booking';
      if (reason === 'quote' || reason === 'service') {
        routeMsg = `Perfect, thanks for that info! Here's our booking link — pick whatever time works: ${c.booking_link || 'https://cal.com/yourbiz'}\n\nWe'll have a tech ready for you. 🔧`;
      } else {
        routeMsg = `Great question! We're forwarding this to our team — someone will text you back within 30 minutes. Thanks for your patience!`;
        routedTo = 'owner_notify';
      }
      const routeSms: SmsLog = {
        id: uid(), direction: 'outbound', from_number: c.twilio_phone_number, to_number: phone,
        body: routeMsg, status: 'sent', sent_at: new Date().toISOString(), step: 'qual',
      };
      useAppStore.setState((s) => ({
        smsLog: [...s.smsLog, routeSms],
        qualFlows: s.qualFlows.map(q => q.phone === phone
          ? { ...q, stage: 'routed' as const, routedTo, answers: [...q.answers, resp], completedAt: new Date().toISOString() }
          : q),
      }));
    }, 1500);
  }, 2500);
}

/** Simulation-only: send referral request SMS and a fake response. */
export function runSimulatedReferralRequest(store: Store, phone: string) {
  const c = store.getActiveClient();
  const sms: SmsLog = {
    id: uid(), direction: 'outbound', from_number: c.twilio_phone_number, to_number: phone,
    body: `Glad we could help! 🙌 Know someone who could use our services? Reply with their name and we'll reach out — plus you'll get a referral reward!\n\nJust reply: [Name] [Phone]`,
    status: 'sent', sent_at: new Date().toISOString(), step: 'referral',
  };
  useAppStore.setState((s) => ({ smsLog: [...s.smsLog, sms] }));

  setTimeout(() => {
    const names = ['Maria Garcia', 'James Wilson', 'Diana Reyes', 'Robert Chen'];
    const phones = ['+17865550901', '+13055550822', '+17865550733', '+13055550644'];
    const idx = Math.floor(Math.random() * names.length);
    const reply: SmsLog = {
      id: uid(), direction: 'inbound', from_number: phone, to_number: c.twilio_phone_number,
      body: `${names[idx]} ${phones[idx]}`, status: 'received', sent_at: new Date().toISOString(), intent: 'referral',
    };
    useAppStore.setState((s) => ({ smsLog: [...s.smsLog, reply] }));
    storeSimulatedReferralResponse(useAppStore.getState(), phone, names[idx], phones[idx]);
  }, 3000);
}

function storeSimulatedReferralResponse(store: Store, phone: string, name: string, referredPhone?: string) {
  const code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const c = store.getActiveClient();
  const referral: Referral = {
    id: uid(), phone, referredName: name, referredPhone, trackingCode: code,
    status: 'pending', createdAt: new Date().toISOString(),
  };
  const confirmSms: SmsLog = {
    id: uid(), direction: 'outbound', from_number: c.twilio_phone_number, to_number: phone,
    body: `Thanks! We'll reach out to ${name}. Your referral code is ${code} — we'll let you know when they book! 🎉`,
    status: 'sent', sent_at: new Date().toISOString(), step: 'referral',
  };
  useAppStore.setState((s) => ({
    referrals: [...s.referrals, referral],
    smsLog: [...s.smsLog, confirmSms],
  }));
}
