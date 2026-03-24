import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isDemoMode, demoHelpers, callLogs as clApi, smsLog as smApi } from '../lib/supabase'
import type { CallLog, SMSMessage } from '../types'

export function useActivity(clientId: string | null) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [smsLog, setSmsLog] = useState<SMSMessage[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<any>(null)

  const load = useCallback(async () => {
    if (!clientId) { setLoading(false); return }
    setLoading(true)

    if (isDemoMode) {
      const [calls, sms] = await Promise.all([clApi.list(clientId), smApi.list(clientId)])
      setCallLogs(calls)
      setSmsLog(sms)
      setLoading(false)
      return
    }

    const [{ data: calls }, { data: sms }] = await Promise.all([
      supabase.from('call_logs').select('*').eq('client_id', clientId).order('received_at', { ascending: false }).limit(100),
      supabase.from('sms_log').select('*').eq('client_id', clientId).order('sent_at', { ascending: false }).limit(200),
    ])
    setCallLogs(calls || [])
    setSmsLog(sms || [])
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    load()
    if (!clientId || isDemoMode) return

    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase.channel(`activity:${clientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_logs', filter: `client_id=eq.${clientId}` }, p => setCallLogs(prev => [p.new as CallLog, ...prev]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sms_log', filter: `client_id=eq.${clientId}` }, p => setSmsLog(prev => [p.new as SMSMessage, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sms_log', filter: `client_id=eq.${clientId}` }, p => setSmsLog(prev => prev.map(m => m.id === p.new.id ? p.new as SMSMessage : m)))
      .subscribe()
    channelRef.current = ch
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [clientId, load])

  const deleteLog = async (type: 'call' | 'sms', id: string) => {
    if (isDemoMode) {
      if (type === 'call') { demoHelpers.deleteCallLog(id); setCallLogs(prev => prev.filter(c => c.id !== id)) }
      else { demoHelpers.deleteSmsLog(id); setSmsLog(prev => prev.filter(s => s.id !== id)) }
      return
    }
    if (type === 'call') { await supabase.from('call_logs').delete().eq('id', id); setCallLogs(prev => prev.filter(c => c.id !== id)) }
    else { await supabase.from('sms_log').delete().eq('id', id); setSmsLog(prev => prev.filter(s => s.id !== id)) }
  }

  const clearAll = async () => {
    if (!clientId) return
    if (isDemoMode) { demoHelpers.clearActivity(clientId); setCallLogs([]); setSmsLog([]); return }
    await Promise.all([supabase.from('call_logs').delete().eq('client_id', clientId), supabase.from('sms_log').delete().eq('client_id', clientId)])
    setCallLogs([]); setSmsLog([])
  }

  return { callLogs, smsLog, loading, deleteLog, clearAll, reload: load }
}
