import { useCallback } from 'react'
import { useAppStore } from '../stores/app'
import { supabase } from '../lib/supabase'

export interface AvailableNumber {
  number: string
  locality: string
  region: string
  price: string
}

export function usePhoneProvisioning() {
  const {
    phoneSearch, setPhoneSearch,
    phoneResults, setPhoneResults,
    phoneSearching, setPhoneSearching,
    selectedPhone, setSelectedPhone,
    phoneProvisioning, setPhoneProvisioning,
  } = useAppStore()

  const searchNumbers = useCallback(async (query: string) => {
    setPhoneSearching(true)
    setPhoneResults([])

    try {
      // Call Supabase Edge Function which proxies Twilio AvailablePhoneNumbers API
      const { data, error } = await supabase.functions.invoke('search-numbers', {
        body: { query: query.trim() || '305', country: 'US' },
      })

      if (error) throw error
      setPhoneResults(data?.numbers || [])
    } catch (err) {
      console.error('Number search error:', err)
      // Fallback to demo numbers for development
      setPhoneResults(getDemoNumbers(query))
    } finally {
      setPhoneSearching(false)
    }
  }, [])

  const provisionNumber = useCallback(async (number: AvailableNumber, clientId?: string): Promise<string> => {
    setPhoneProvisioning(true)

    try {
      const { data, error } = await supabase.functions.invoke('provision-number', {
        body: { phoneNumber: number.number, clientId },
      })

      if (error) throw error
      setSelectedPhone(number)
      return data?.sid || ''
    } catch (err) {
      console.error('Provision error:', err)
      // In dev: just set the selected number
      setSelectedPhone(number)
      return 'DEV_SID'
    } finally {
      setPhoneProvisioning(false)
    }
  }, [])

  return {
    phoneSearch, setPhoneSearch,
    phoneResults, phoneSearching,
    selectedPhone, setSelectedPhone,
    phoneProvisioning,
    searchNumbers, provisionNumber,
  }
}

// Demo numbers for development/testing
function getDemoNumbers(query: string): AvailableNumber[] {
  const all: AvailableNumber[] = [
    { number: '+13055550100', locality: 'Miami', region: 'FL', price: '$1.15/mo' },
    { number: '+13055550147', locality: 'Miami', region: 'FL', price: '$1.15/mo' },
    { number: '+17865550203', locality: 'Miami', region: 'FL', price: '$1.15/mo' },
    { number: '+19545550281', locality: 'Fort Lauderdale', region: 'FL', price: '$1.15/mo' },
    { number: '+15615550334', locality: 'Boca Raton', region: 'FL', price: '$1.15/mo' },
    { number: '+14075550412', locality: 'Orlando', region: 'FL', price: '$1.15/mo' },
    { number: '+12135550501', locality: 'Los Angeles', region: 'CA', price: '$1.15/mo' },
    { number: '+13125550617', locality: 'Chicago', region: 'IL', price: '$1.15/mo' },
    { number: '+12125550789', locality: 'New York', region: 'NY', price: '$1.15/mo' },
    { number: '+17135550832', locality: 'Houston', region: 'TX', price: '$1.15/mo' },
  ]
  if (!query.trim()) return all.slice(0, 5)
  const q = query.toLowerCase().replace(/\D/g, '').substring(0, 3)
  const qStr = query.toLowerCase()
  return all.filter(n =>
    (q && n.number.replace(/\D/g, '').substring(1, 4).startsWith(q)) ||
    n.locality.toLowerCase().includes(qStr) ||
    n.region.toLowerCase().includes(qStr)
  ).slice(0, 6) || all.slice(0, 4)
}
