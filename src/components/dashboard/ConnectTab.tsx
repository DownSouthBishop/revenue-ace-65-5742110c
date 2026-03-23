import { useState } from 'react';
import type { Client } from '@/types/respondfall';

const CARRIERS = [
  { id: 'att', name: 'AT&T', code: '*61*+1XXXXXXXXXX*11*20#', off: '##61#' },
  { id: 'tmobile', name: 'T-Mobile', code: '**61*+1XXXXXXXXXX#', off: '##61#' },
  { id: 'verizon', name: 'Verizon', code: '*71+1XXXXXXXXXX', off: '*73' },
  { id: 'other', name: 'Other', code: '**61*+1XXXXXXXXXX**30#', off: '##61#' },
];

const SOURCES = [
  { id: 'iphone', l: 'iPhone', i: '🍎' },
  { id: 'android', l: 'Android', i: '🤖' },
  { id: 'google', l: 'Google Voice', i: '🔵' },
  { id: 'landline', l: 'Landline/VoIP', i: '☎️' },
  { id: 'ringcentral', l: 'RingCentral', i: '📞' },
  { id: 'openphone', l: 'OpenPhone', i: '📱' },
];

export function ConnectTab({ client }: { client: Client }) {
  const [source, setSource] = useState('iphone');
  const [carrier, setCarrier] = useState('att');
  const car = CARRIERS.find(c => c.id === carrier) || CARRIERS[0];

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <div className="bg-s1 border border-blue rounded-xl p-5 mb-3.5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5"><span className="w-[3px] h-4 gradient-indicator rounded-sm" />Your Respondfall Number</div>
        <div className="flex items-center justify-between bg-3 border border-success rounded-[10px] p-3.5 px-4">
          <div>
            <div className="font-mono text-lg font-semibold text-success">{client.twilio_phone_number}</div>
            <div className="text-[11px] font-mono text-t3 mt-0.5">SkyforgeAI Infrastructure · Managed for you</div>
          </div>
          <button className="bg-s2 border border-blue-2 rounded-lg text-t2 text-[11px] font-mono px-3.5 py-2 cursor-pointer hover:text-sky hover:border-primary transition-all" onClick={() => copyText(client.twilio_phone_number)}>Copy Number</button>
        </div>
      </div>

      <div className="bg-s1 border border-blue rounded-xl p-5">
        <div className="font-display text-base font-bold tracking-[.05em] mb-4 flex items-center gap-2.5"><span className="w-[3px] h-4 gradient-indicator rounded-sm" />Conditional Call Forwarding Setup</div>
        <div className="bg-sky-dim border border-blue-2 rounded-lg p-3 text-xs text-t2 mb-4 leading-relaxed border-l-[3px] border-l-primary">
          Client keeps their existing number. <strong className="text-sky">Only missed calls forward</strong> to your Respondfall number.
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {SOURCES.map(s => (
            <div
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`border rounded-[10px] p-3.5 cursor-pointer text-center transition-all ${
                source === s.id
                  ? 'bg-sky-dim border-2 border-primary glow-sky'
                  : 'bg-s1 border-blue hover:bg-s2 hover:border-blue-2'
              }`}
            >
              <div className="text-xl mb-1.5">{s.i}</div>
              <div className={`text-[11px] font-mono tracking-[.06em] ${source === s.id ? 'text-sky' : 'text-t2'}`}>{s.l}</div>
            </div>
          ))}
        </div>

        {(source === 'iphone' || source === 'android') && (
          <>
            <div className="flex gap-1.5 flex-wrap mb-3.5">
              {CARRIERS.map(cr => (
                <button
                  key={cr.id}
                  onClick={() => setCarrier(cr.id)}
                  className={`py-1 px-3 rounded-md border text-[11px] font-mono cursor-pointer transition-all ${
                    carrier === cr.id ? 'border-primary text-sky bg-sky-dim' : 'border-blue text-t3 bg-transparent'
                  }`}
                >
                  {cr.name}
                </button>
              ))}
            </div>
            <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">Dial from Phone app · Replace XXXXXXXXXX with digits of {client.twilio_phone_number}</label>
            <div className="bg-background border border-blue-2 rounded-lg p-3 font-mono text-[13px] text-sky cursor-pointer flex justify-between items-center gap-3 my-2 hover:border-primary hover:shadow-[0_0_12px_hsl(var(--sky-dim))] transition-all" onClick={() => copyText(car.code)}>
              <span>{car.code}</span>
              <span className="text-[10px] text-t3 flex-shrink-0">tap to copy</span>
            </div>
            <div className="text-[11px] text-t3 font-mono mt-2">To disable: <strong>{car.off}</strong></div>
          </>
        )}

        {source === 'google' && (
          <div className="text-[13px] text-t2 leading-loose">
            <strong className="text-foreground">voice.google.com</strong> → Settings → Calls → Call Forwarding → Add {client.twilio_phone_number} → 20 second ring time.
          </div>
        )}
        {source === 'landline' && (
          <div className="text-[13px] text-t2 leading-loose">
            Pick up handset → dial <span className="text-sky font-mono">*92 {client.twilio_phone_number}</span> → 2 beeps = forwarding active.
          </div>
        )}
        {source === 'ringcentral' && (
          <div className="text-[13px] text-t2 leading-loose">
            <strong>app.ringcentral.com</strong> → Admin Portal → Phone System → Users → Call Handling → "If no one answers" → Forward to {client.twilio_phone_number}.
          </div>
        )}
        {source === 'openphone' && (
          <div className="text-[13px] text-t2 leading-loose">
            OpenPhone → Settings → your number → Call Forwarding → "When unavailable" → enter {client.twilio_phone_number}.
          </div>
        )}
      </div>
    </div>
  );
}
