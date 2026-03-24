import React, { useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { ActivityFeed } from '../components/dashboard/ActivityFeed'
import { Inbox } from '../components/dashboard/Inbox'
import { SequencesTab } from '../components/dashboard/SequencesTab'
import { AnalyticsTab } from '../components/dashboard/AnalyticsTab'
import { SettingsTab } from '../components/dashboard/SettingsTab'
import { ConnectTab } from '../components/dashboard/ConnectTab'
import { AddClientModal } from '../components/dashboard/AddClientModal'
import { ConfirmDelete } from '../components/ui/ConfirmDelete'
import { useClients } from '../hooks/useClients'
import { useActivity } from '../hooks/useActivity'
import { useAppStore } from '../stores/app'
import { webhookHealth as whApi } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import type { DashTab, WebhookHealth } from '../types'

interface Props { onLogout: () => void }

const TABS: { id: DashTab; label: string }[] = [
  { id: 'activity',  label: 'Activity'  },
  { id: 'inbox',     label: 'Inbox'     },
  { id: 'sequences', label: 'Sequences' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'config',    label: 'Settings'  },
  { id: 'connect',   label: 'Connect'   },
]

export function DashboardPage({ onLogout }: Props) {
  const {
    activeClientId, setActiveClientId,
    activeTab, setActiveTab,
    showAddClientModal,
    showConfirmDelete, setShowConfirmDelete,
  } = useAppStore()

  const { clients, loading: cLoading, createClient, updateClient, deleteClient } = useClients()
  const [health, setHealth] = useState<WebhookHealth | null>(null)
  const { smsLog } = useActivity(activeClientId)

  // Pick first client by default
  useEffect(() => {
    if (!activeClientId && clients.length > 0) {
      setActiveClientId(clients[0].id)
    }
  }, [clients, activeClientId])

  // Load webhook health for active client
  useEffect(() => {
    if (!activeClientId) return
    whApi.get(activeClientId).then(setHealth)
    const sub = supabase
      .channel(`wh:${activeClientId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'webhook_health', filter: `client_id=eq.${activeClientId}` },
        p => setHealth(p.new as WebhookHealth))
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [activeClientId])

  const client = clients.find(c => c.id === activeClientId)

  // Inbox unread count
  const inboxUnread = (() => {
    if (!activeClientId) return 0
    const phones = new Set<string>()
    smsLog.forEach(m => {
      if (m.direction === 'inbound') phones.add(m.from_number)
    })
    return phones.size
  })()

  // Health status
  const hs = !health?.last_ping_at ? 'err'
    : (health.consecutive_failures ?? 0) > 2 ? 'warn'
    : 'ok'
  const hlLabel = { ok: 'SYSTEM ACTIVE', warn: 'ERRORS DETECTED', err: 'NOT CONNECTED' }[hs]
  const hlColor = { ok: 'var(--ok)', warn: 'var(--warn)', err: 'var(--err)' }[hs]

  // Analytics for stat row
  const a = {
    mt: 0,  // Will be loaded from analytics view
    st: smsLog.filter(s => {
      const d = new Date(s.sent_at); const now = new Date()
      return d.getDate() === now.getDate() && s.direction === 'outbound'
    }).length,
  }

  // Confirm delete handler
  const handleConfirmDelete = async (type: string, id: string) => {
    if (type === 'client') {
      await deleteClient(id)
      if (clients.length > 1) {
        const remaining = clients.filter(c => c.id !== id)
        setActiveClientId(remaining[0].id)
      }
    } else if (type === 'activity-all' || type === 'inbox-all') {
      await supabase.from('call_logs').delete().eq('client_id', id)
      await supabase.from('sms_log').delete().eq('client_id', id)
    } else if (type === 'convo') {
      // id is the phone number here
      await supabase.from('sms_log').delete()
        .eq('client_id', activeClientId!)
        .or(`from_number.eq.${id},to_number.eq.${id}`)
    } else if (type === 'call') {
      await supabase.from('call_logs').delete().eq('id', id)
    } else if (type === 'sms') {
      await supabase.from('sms_log').delete().eq('id', id)
    }
  }

  if (cLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ color: '#4a6080', fontFamily: "'JetBrains Mono'", fontSize: 13 }}>
      Loading platform...
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar clients={clients} onLogout={onLogout} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        {client ? (
          <div
            className="flex items-center justify-between flex-shrink-0 relative"
            style={{ padding: '14px 24px', borderBottom: '1px solid var(--b1)', background: 'var(--bg2)' }}
          >
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, var(--blue) 30%, var(--ember) 70%, transparent)', opacity: .22 }}
            />
            <div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, letterSpacing: '.06em', color: '#e8edf5' }}>
                {client.name}
              </div>
              <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: '#4a6080', marginTop: 2 }}>
                {client.twilio_phone_number} · Respondfall AI Active
              </div>
            </div>
            <div className={`sf-health ${hs}`}>
              <div className="animate-pulse-dot rounded-full" style={{ width: 6, height: 6, background: hlColor }} />
              {hlLabel}
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--b1)', background: 'var(--bg2)' }}>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: '#4a6080' }}>No client selected — add one to get started</div>
          </div>
        )}

        {/* Stat row */}
        {client && (
          <StatRow client={client} />
        )}

        {/* Tab bar */}
        {client && (
          <div style={{ padding: '14px 24px 0', flexShrink: 0 }}>
            <div className="sf-tabbar" style={{ overflowX: 'auto' }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`sf-tab${activeTab === t.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                  {t.id === 'inbox' && inboxUnread > 0 && (
                    <span style={{ display: 'inline-block', background: 'var(--ember)', color: '#fff', fontSize: 9, borderRadius: 8, padding: '1px 5px', marginLeft: 4, fontFamily: "'JetBrains Mono'" }}>
                      {inboxUnread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 60px', animation: 'sf-fade-up .2s ease' }}>
          {!client ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div style={{ fontSize: 32, marginBottom: 12, opacity: .5 }}>🏢</div>
              <div style={{ fontSize: 14, color: '#4a6080', fontFamily: "'JetBrains Mono'" }}>Add your first client to start capturing missed calls</div>
            </div>
          ) : (
            <>
              {activeTab === 'activity'  && <ActivityFeed client={client} />}
              {activeTab === 'inbox'     && <Inbox client={client} />}
              {activeTab === 'sequences' && <SequencesTab client={client} />}
              {activeTab === 'analytics' && <AnalyticsTab client={client} />}
              {activeTab === 'config'    && <SettingsTab client={client} onUpdate={updateClient} />}
              {activeTab === 'connect'   && <ConnectTab client={client} />}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddClientModal && <AddClientModal onAdd={async (insert) => { await createClient(insert) }} />}
      <ConfirmDelete onConfirm={handleConfirmDelete} />
    </div>
  )
}

function StatRow({ client }: { client: any }) {
  const [anal, setAnal] = useState<any>(null)
  useEffect(() => {
    supabase.from('client_analytics').select('*').eq('client_id', client.id).single()
      .then(({ data }) => setAnal(data))
  }, [client.id])

  const stats = [
    { l: 'Missed Today',        v: anal?.missed_today ?? '—',      cls: 'blue' },
    { l: 'SMS Sent Today',      v: anal?.sms_today ?? '—',         cls: '' },
    { l: 'Missed · 30 Days',    v: anal?.missed_30d ?? '—',        cls: '' },
    { l: 'Revenue Protected 30d', v: anal?.revenue_protected_30d ? `$${Number(anal.revenue_protected_30d).toLocaleString()}` : '—', cls: 'ember' },
  ]

  return (
    <div style={{ padding: '16px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flexShrink: 0 }}>
      {stats.map(s => (
        <div key={s.l} className="sf-stat">
          <div className="sf-stat-label">{s.l}</div>
          <div className={`sf-stat-value ${s.cls}`}>{s.v}</div>
          <div className="sf-stat-sub">{s.l.includes('Revenue') ? `${client.name} · last 30 days` : 'Live'}</div>
        </div>
      ))}
    </div>
  )
}
