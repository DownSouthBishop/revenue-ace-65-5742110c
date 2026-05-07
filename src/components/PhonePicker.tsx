import { forwardRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AvailableNumber = { number: string; friendly?: string; locality: string; region: string };

export const PhonePicker = forwardRef<
  HTMLDivElement,
  { onSelect: (num: string) => void; selected?: string }
>(function PhonePicker({ onSelect, selected }, ref) {
  const [results, setResults] = useState<AvailableNumber[]>([]);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const search = async () => {
    setSearching(true);
    setError('');
    const isAreaCode = /^\d{3}$/.test(query.trim());
    const { data, error } = await supabase.functions.invoke('twilio-search-numbers', {
      body: isAreaCode ? { areaCode: query.trim() } : { contains: query.trim() || undefined },
    });
    setSearching(false);
    if (error) {
      setError(error.message || 'Search failed');
      return;
    }
    setResults(data?.numbers || []);
  };

  return (
    <div ref={ref} className="bg-3 border border-blue-2 rounded-xl p-4">
      <div className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-1.5">
        Search Available Numbers
      </div>
      <div className="text-[10px] font-mono text-t3/80 mb-2 leading-relaxed">
        Numbers shown are real-time examples. The number you select will be provisioned to your
        account at checkout.
      </div>
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-2.5 outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--sky-dim))]"
          placeholder="3-digit area code (e.g. 305) or city"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button
          className="gradient-sky text-primary-foreground border-none rounded-lg px-4 font-display text-xs font-bold tracking-[.06em] uppercase cursor-pointer glow-sky hover:-translate-y-px transition-all disabled:opacity-50 active:scale-[0.98]"
          onClick={search}
          disabled={searching}
        >
          {searching ? '◌' : '🔍 SEARCH'}
        </button>
      </div>
      {error && <div className="text-[11px] text-destructive font-mono mb-2">{error}</div>}
      {results.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
          {results.map((r) => (
            <div
              key={r.number}
              className={`flex items-center justify-between p-2.5 px-3.5 border rounded-lg cursor-pointer transition-all ${
                selected === r.number
                  ? 'border-primary bg-sky-dim glow-sky'
                  : 'border-blue bg-s1 hover:border-primary hover:bg-sky-dim'
              }`}
              onClick={() => onSelect(r.number)}
            >
              <div>
                <div className="font-mono text-[13px] font-medium text-foreground">{r.number}</div>
                <div className="text-[11px] text-t3">
                  {r.locality || '—'}
                  {r.region ? `, ${r.region}` : ''}
                </div>
              </div>
              {selected === r.number ? (
                <span className="text-[10px] font-mono bg-success-bg text-success border border-success rounded px-2 py-0.5">
                  SELECTED
                </span>
              ) : (
                <span className="text-[10px] font-mono text-t3">tap to select</span>
              )}
            </div>
          ))}
        </div>
      )}
      {!searching && results.length === 0 && (
        <div className="text-[11px] font-mono text-t3">
          Enter an area code or city, then press Search.
        </div>
      )}
    </div>
  );
});
