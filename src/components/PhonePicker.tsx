import { useState } from 'react';
import { useAppStore } from '@/store/appStore';

export function PhonePicker({ onSelect, selected }: { onSelect: (num: string) => void; selected?: string }) {
  const { phoneResults, phoneSearching, searchPhoneNumbers } = useAppStore();
  const [query, setQuery] = useState('');
  const [provisioning, setProvisioning] = useState<string | null>(null);

  const handleClaim = (num: string) => {
    setProvisioning(num);
    setTimeout(() => {
      onSelect(num);
      setProvisioning(null);
    }, 1200);
  };

  return (
    <div className="bg-3 border border-blue-2 rounded-xl p-4">
      <div className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-1.5">Search Available Numbers</div>
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-2.5 outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--sky-dim))]"
          placeholder="Area code or city (e.g. 305, Miami...)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchPhoneNumbers(query)}
        />
        <button
          className="gradient-sky text-primary-foreground border-none rounded-lg px-4 font-display text-xs font-bold tracking-[.06em] uppercase cursor-pointer glow-sky hover:-translate-y-px transition-all disabled:opacity-50 active:scale-[0.98]"
          onClick={() => searchPhoneNumbers(query)}
          disabled={phoneSearching}
        >
          {phoneSearching ? '◌' : '🔍 SEARCH'}
        </button>
      </div>
      {phoneResults.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
          {phoneResults.map(r => (
            <div
              key={r.number}
              className={`flex items-center justify-between p-2.5 px-3.5 border rounded-lg cursor-pointer transition-all ${
                selected === r.number
                  ? 'border-primary bg-sky-dim glow-sky'
                  : 'border-blue bg-s1 hover:border-primary hover:bg-sky-dim'
              }`}
              onClick={() => handleClaim(r.number)}
            >
              <div>
                <div className="font-mono text-[13px] font-medium text-foreground">{r.number}</div>
                <div className="text-[11px] text-t3">{r.locality}, {r.region}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-success">{r.price}</span>
                {selected === r.number ? (
                  <span className="text-[10px] font-mono bg-success-bg text-success border border-success rounded px-2 py-0.5">SELECTED</span>
                ) : (
                  <button
                    className="gradient-sky text-primary-foreground border-none rounded-lg px-3 py-1 text-[11px] font-display font-bold cursor-pointer transition-all active:scale-[0.95]"
                    onClick={(e) => { e.stopPropagation(); handleClaim(r.number); }}
                    disabled={provisioning === r.number}
                  >
                    {provisioning === r.number ? '◌' : 'CLAIM'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
