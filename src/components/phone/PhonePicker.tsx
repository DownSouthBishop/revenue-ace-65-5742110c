import React, { useState } from 'react'
import { usePhoneProvisioning } from '../../hooks/usePhoneProvisioning'
import type { AvailableNumber } from '../../hooks/usePhoneProvisioning'

interface Props {
  onSelect: (number: AvailableNumber) => void
  selectedNumber?: string
  className?: string
}

export function PhonePicker({ onSelect, selectedNumber, className = '' }: Props) {
  const {
    phoneSearch, setPhoneSearch,
    phoneResults, phoneSearching,
    phoneProvisioning,
    searchNumbers, provisionNumber,
  } = usePhoneProvisioning()

  const [provisioningNum, setProvisioningNum] = useState<string | null>(null)

  const handleSearch = () => searchNumbers(phoneSearch)

  const handleClaim = async (num: AvailableNumber) => {
    setProvisioningNum(num.number)
    await provisionNumber(num)
    onSelect(num)
    setProvisioningNum(null)
  }

  return (
    <div className={`rounded-xl border p-4 ${className}`}
      style={{ background: 'var(--bg3)', borderColor: 'var(--b2)' }}>

      <label className="sf-label">Search Available Numbers</label>

      {/* Search row */}
      <div className="flex gap-2 mb-3">
        <input
          className="sf-input flex-1"
          placeholder="Area code or city (e.g. 305, Miami, Dallas...)"
          value={phoneSearch}
          onChange={e => setPhoneSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button
          className="sf-btn-primary"
          style={{ padding: '0 18px', fontSize: '12px' }}
          onClick={handleSearch}
          disabled={phoneSearching}
        >
          {phoneSearching ? <span className="animate-spin-slow">◌</span> : '🔍 SEARCH'}
        </button>
      </div>

      {/* Results */}
      {phoneResults.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
          {phoneResults.map(num => {
            const isSelected = selectedNumber === num.number
            const isClaiming = provisioningNum === num.number
            return (
              <div
                key={num.number}
                onClick={() => !isSelected && handleClaim(num)}
                className="flex items-center justify-between rounded-lg cursor-pointer transition-all duration-150 px-3.5 py-2.5"
                style={{
                  background: isSelected ? 'var(--bluedim)' : 'var(--s1)',
                  border: `1px solid ${isSelected ? 'var(--blue)' : 'var(--b1)'}`,
                  boxShadow: isSelected ? '0 0 8px var(--blueglow)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '13px', fontWeight: 500, color: '#e8edf5' }}>
                    {num.number}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4a6080' }}>{num.locality}, {num.region}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: 'var(--ok)' }}>{num.price}</span>
                  {isSelected
                    ? <span className="sf-badge sf-badge-ok">✓ CLAIMED</span>
                    : <button
                        className="sf-btn-primary"
                        style={{ padding: '4px 12px', fontSize: '11px' }}
                        onClick={e => { e.stopPropagation(); handleClaim(num) }}
                        disabled={isClaiming || phoneProvisioning}
                      >
                        {isClaiming ? <span className="animate-spin-slow">◌</span> : 'CLAIM'}
                      </button>
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* No results */}
      {phoneResults.length === 0 && !phoneSearching && phoneSearch && (
        <div style={{ fontSize: '12px', color: '#4a6080', textAlign: 'center', padding: '12px 0' }}>
          No numbers found. Try a different area code or city.
        </div>
      )}
    </div>
  )
}
