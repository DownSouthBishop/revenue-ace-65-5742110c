import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { CallLog, SMSMessage } from '../types'

export function useActivity(clientId: string | null) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [smsLog, setSmsLog] = useState<SMSMessage[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const load = useCallback(async () => {
    if (!clientId) { setLoading(false); return }
    setLoading(true)

    const [{ data: calls }, { data: sms }] = await Promise.all([
      supabase.from('call_logs').select('*').eq('client_id', clientId)
        .order('received_at', { ascending: false }).limit(100),
      supabase.from('sms_log').select('*').eq('client_id', clientId)
        .order('sent_at', { ascending: false }).limit(200),
    ])

    setCallLogs(calls || [])
    setSmsLog(sms || [])
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    load()
    if (!clientId) return

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Subscribe realtime
    const ch = supabase
      .channel(`activity:${clientId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'call_logs',
        filter: `client_id=eq.${clientId}`,
      }, (payload) => {
        setCallLogs(prev => [payload.new as CallLog, ...prev])
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'sms_log',
        filter: `client_id=eq.${clientId}`,
      }, (payload) => {
        setSmsLog(prev => [payload.new as SMSMessage, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sms_log',
        filter: `client_id=eq.${clientId}`,
      }, (payload) => {
        setSmsLog(prev => prev.map(m => m.id === payload.new.id ? payload.new as SMSMessage : m))
      })
      .subscribe()

    channelRef.current = ch

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [clientId, load])

  const deleteLog = async (type: 'call' | 'sms', id: string) => {
    if (type === 'call') {
      await supabase.from('call_logs').delete().eq('id', id)
      setCallLogs(prev => prev.filter(c => c.id !== id))
    } else {
      await supabase.from('sms_log').delete().eq('id', id)
      setSmsLog(prev => prev.filter(s => s.id !== id))
    }
  }

  const clearAll = async () => {
    if (!clientId) return
    await Promise.all([
      supabase.from('call_logs').delete().eq('client_id', clientId),
      supabase.from('sms_log').delete().eq('client_id', clientId),
    ])
    setCallLogs([])
    setSmsLog([])
  }

  return { callLogs, smsLog, loading, deleteLog, clearAll, reload: load }
}
