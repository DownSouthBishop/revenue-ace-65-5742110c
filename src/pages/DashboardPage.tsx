import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import { EagleLogo } from '@/components/EagleLogo';
import { ActivityTab } from '@/components/dashboard/ActivityTab';
import { InboxTab } from '@/components/dashboard/InboxTab';
import { SequencesTab } from '@/components/dashboard/SequencesTab';
import { AnalyticsTab } from '@/components/dashboard/AnalyticsTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';
import { ConnectTab } from '@/components/dashboard/ConnectTab';
import { AddClientModal } from '@/components/dashboard/AddClientModal';
import { ConfirmDeleteModal } from '@/components/dashboard/ConfirmDeleteModal';
import type { TabId } from '@/types/respondfall';

const TABS: { id: TabId; label: string; mobileLabel: string }[] = [
  { id: 'activity', label: 'Activity', mobileLabel: '📡' },
  { id: 'inbox', label: 'Inbox', mobileLabel: '💬' },
  { id: 'sequences', label: 'Sequences', mobileLabel: '🔄' },
  { id: 'analytics', label: 'Analytics', mobileLabel: '📊' },
  { id: 'config', label: 'Settings', mobileLabel: '⚙️' },
  { id: 'connect', label: 'Connect', mobileLabel: '📞' },
];

export default function DashboardPage() {
  const {
    clients, activeClientId, setActiveClientId, tab, setTab,
    sidebarOpen, toggleSidebar, setShowAddModal, showAddModal, confirmDel,
    smsLog, mobileMenuOpen, setMobileMenuOpen,
    loadActivityForClient, subscribeActivity, unsubscribeActivity,
  } = useAppStore();

  const client = clients.find(c => c.id === activeClientId) || clients[0];
  const [stats30, setStats30] = useState({ missed: 0, smsSent: 0, missedToday: 0, smsToday: 0 });

  useEffect(() => {
    if (!activeClientId) return;
    loadActivityForClient(activeClientId);
    subscribeActivity(activeClientId);
    return () => unsubscribeActivity();
  }, [activeClientId, loadActivityForClient, subscribeActivity, unsubscribeActivity]);

  useEffect(() => {
    if (!activeClientId) return;
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const sinceToday = new Date(); sinceToday.setHours(0, 0, 0, 0);
    Promise.all([
      supabase.from('missed_calls').select('id', { count: 'exact', head: true }).eq('client_id', activeClientId).gte('called_at', since30),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('client_id', activeClientId).eq('direction', 'outbound').gte('sent_at', since30),
      supabase.from('missed_calls').select('id', { count: 'exact', head: true }).eq('client_id', activeClientId).gte('called_at', sinceToday.toISOString()),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('client_id', activeClientId).eq('direction', 'outbound').gte('sent_at', sinceToday.toISOString()),
    ]).then(([a, b, c, d]) => setStats30({
      missed: a.count ?? 0, smsSent: b.count ?? 0, missedToday: c.count ?? 0, smsToday: d.count ?? 0,
    }));
  }, [activeClientId, smsLog.length]);

  if (!client) return null;

  const phones = new Set<string>();
  smsLog.forEach(m => {
    if (m.direction === 'inbound') phones.add(m.from_number);
  });
  const inboxCount = phones.size;

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-2 border-b border-blue px-4 py-2.5 flex items-center justify-between safe-top">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-t2 text-lg p-1">☰</button>
          <EagleLogo size="sm" />
          <div className="font-display text-sm font-bold tracking-[.06em] text-gradient-brand">RESPONDFALL</div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-medium tracking-[.08em] bg-success-bg border border-success text-success">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
          LIVE
        </div>
      </div>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-[rgba(5,7,13,0.85)] backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-2 border-r border-blue overflow-y-auto animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-blue flex items-center gap-3">
              <EagleLogo size="sm" />
              <div>
                <div className="font-display text-base font-bold tracking-[.06em] text-gradient-brand">RESPONDFALL</div>
                <div className="text-[9px] font-mono text-t3 tracking-[.12em] uppercase">by <span className="text-ember">SkyforgeAI</span></div>
              </div>
            </div>
            <div className="text-[9px] font-mono text-t4 uppercase tracking-[.12em] px-4 pt-3 pb-1.5">Client Accounts</div>
            <div className="p-2">
              {clients.map(cl => (
                <div
                  key={cl.id}
                  onClick={() => setActiveClientId(cl.id)}
                  className={`flex items-center gap-2.5 py-2.5 px-3 rounded-lg cursor-pointer border mb-0.5 transition-all relative ${
                    cl.id === activeClientId ? 'bg-sky-dim border-blue-2' : 'border-transparent hover:bg-s1'
                  }`}
                >
                  {cl.id === activeClientId && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-sm gradient-indicator" />
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display text-sm font-bold flex-shrink-0 border transition-all ${
                    cl.id === activeClientId ? 'gradient-sky text-primary-foreground border-primary glow-sky' : 'bg-s2 text-t2 border-blue'
                  }`}>{cl.name.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-medium truncate ${cl.id === activeClientId ? 'text-sky' : 'text-foreground'}`}>{cl.name}</div>
                    <div className="text-[10px] font-mono text-t3">{cl.twilio_phone_number}</div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 animate-pulse-dot" />
                </div>
              ))}
              <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg cursor-pointer border border-dashed border-blue text-t3 text-xs my-1 hover:border-primary hover:text-sky hover:bg-sky-dim transition-all" onClick={() => { setShowAddModal(true); setMobileMenuOpen(false); }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0">+</div>
                <span>Add Client</span>
              </div>
            </div>
            <div className="p-3 border-t border-blue mt-auto">
              <div className="px-2.5 py-2 mb-2">
                <div className="text-xs font-medium text-foreground">Agency Owner</div>
                <div className="text-[10px] font-mono text-ember tracking-[.06em]">SkyforgeAI Partner</div>
              </div>
              <button className="w-full bg-transparent border border-blue rounded-md text-t3 py-1.5 cursor-pointer text-[11px] font-mono text-center hover:border-blue-2 hover:text-foreground transition-all" onClick={() => supabase.auth.signOut()}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0 bg-2 border-r border-blue flex-col transition-all duration-300 overflow-hidden hidden lg:flex`}>
        <div className="p-3.5 border-b border-blue flex items-center gap-3 relative">
          <EagleLogo size="sm" />
          {sidebarOpen && (
            <div>
              <div className="font-display text-base font-bold tracking-[.06em] text-gradient-brand">RESPONDFALL</div>
              <div className="text-[9px] font-mono text-t3 tracking-[.12em] uppercase">by <span className="text-ember">SkyforgeAI</span></div>
            </div>
          )}
          <div className="absolute bottom-0 left-3.5 right-3.5 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--sky-blue)), transparent)', opacity: 0.35 }} />
        </div>

        {sidebarOpen && <div className="text-[9px] font-mono text-t4 uppercase tracking-[.12em] px-4 pt-3 pb-1.5">Client Accounts</div>}

        <div className="flex-1 overflow-y-auto p-2">
          {clients.map(cl => (
            <div
              key={cl.id}
              onClick={() => setActiveClientId(cl.id)}
              className={`flex items-center gap-2.5 py-2 px-2.5 rounded-lg cursor-pointer border mb-0.5 transition-all relative ${
                cl.id === activeClientId ? 'bg-sky-dim border-blue-2' : 'border-transparent hover:bg-s1'
              }`}
            >
              {cl.id === activeClientId && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-sm gradient-indicator" />
              )}
              <div className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center font-display text-sm font-bold flex-shrink-0 border transition-all ${
                cl.id === activeClientId ? 'gradient-sky text-primary-foreground border-primary glow-sky' : 'bg-s2 text-t2 border-blue'
              }`}>{cl.name.charAt(0).toUpperCase()}</div>
              {sidebarOpen && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-medium truncate ${cl.id === activeClientId ? 'text-sky' : 'text-foreground'}`}>{cl.name}</div>
                    <div className="text-[10px] font-mono text-t3">{cl.twilio_phone_number}</div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 animate-pulse-dot" />
                </>
              )}
            </div>
          ))}
          <div
            className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg cursor-pointer border border-dashed border-blue text-t3 text-xs my-1 hover:border-primary hover:text-sky hover:bg-sky-dim transition-all"
            onClick={() => setShowAddModal(true)}
          >
            <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-lg flex-shrink-0">+</div>
            {sidebarOpen && <span>Add Client</span>}
          </div>
        </div>

        <div className="p-2 border-t border-blue">
          {sidebarOpen && (
            <div className="px-2.5 py-2 mb-2">
              <div className="text-xs font-medium text-foreground">Agency Owner</div>
              <div className="text-[10px] font-mono text-ember tracking-[.06em]">SkyforgeAI Partner</div>
            </div>
          )}
          <div className="flex gap-1">
            <button className="flex-1 bg-transparent border border-blue rounded-md text-t3 py-1.5 cursor-pointer text-[11px] font-mono text-center hover:border-blue-2 hover:text-foreground transition-all" onClick={toggleSidebar}>
              {sidebarOpen ? '◀' : '▶'}
            </button>
            {sidebarOpen && (
              <button className="flex-1 bg-transparent border border-blue rounded-md text-t3 py-1.5 cursor-pointer text-[11px] font-mono text-center hover:border-blue-2 hover:text-foreground transition-all" onClick={() => setPage('auth')}>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden pt-[52px] lg:pt-0">
        {/* Top bar - desktop */}
        <div className="px-4 lg:px-6 py-3 lg:py-3.5 border-b border-blue flex items-center justify-between flex-shrink-0 bg-2 relative">
          <div className="min-w-0">
            <div className="font-display text-base lg:text-lg font-bold tracking-[.06em] text-foreground truncate">{client.name}</div>
            <div className="text-[10px] lg:text-[11px] font-mono text-t3 mt-0.5 truncate">{client.twilio_phone_number} · Respondfall AI Active</div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-medium tracking-[.08em] bg-success-bg border border-success text-success flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
            SYSTEM ACTIVE
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, hsl(var(--sky-blue)) 30%, hsl(var(--ember)) 70%, transparent)', opacity: 0.22 }} />
        </div>

        {/* Stats row */}
        <div className="px-4 lg:px-6 pt-3 lg:pt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 flex-shrink-0">
          {[
            { label: 'Missed Today', value: String(dailyStats.missed), sub: 'Captured & sequenced', cls: 'text-sky' },
            { label: 'SMS Sent Today', value: String(dailyStats.smsSent), sub: 'All sequence steps', cls: '' },
            { label: 'Missed · 30 Days', value: '47', sub: '89 SMS total', cls: '' },
            { label: 'Revenue Protected', value: `$${(47 * client.avg_job_value).toLocaleString()}`, sub: `47 × $${client.avg_job_value}`, cls: 'text-ember' },
          ].map((s, i) => (
            <div key={i} className="bg-s1 border border-blue rounded-xl p-3 lg:p-4 relative overflow-hidden group hover:border-blue-2 hover:-translate-y-0.5 transition-all">
              <div className="text-[9px] lg:text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-1.5 lg:mb-2.5">{s.label}</div>
              <div className={`font-display text-[22px] lg:text-[30px] font-bold tracking-[.03em] leading-none ${s.cls}`}>{s.value}</div>
              <div className="text-[9px] lg:text-[10px] text-t3 font-mono mt-1 hidden sm:block">{s.sub}</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-bar opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="px-4 lg:px-6 pt-2.5 lg:pt-3.5 flex-shrink-0">
          <div className="flex gap-0.5 bg-s1 border border-blue rounded-[10px] p-1 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`py-1.5 px-2.5 lg:px-4 rounded-[7px] border-none cursor-pointer font-display text-[12px] lg:text-[13px] font-semibold tracking-[.04em] whitespace-nowrap transition-all flex-shrink-0 ${
                  tab === t.id
                    ? 'gradient-sky text-primary-foreground glow-sky'
                    : 'bg-transparent text-t3 hover:text-foreground hover:bg-s2'
                }`}
              >
                <span className="lg:hidden">{t.mobileLabel}</span>
                <span className="hidden lg:inline">{t.label}</span>
                {t.id === 'inbox' && inboxCount > 0 && (
                  <span className="inline-block gradient-ember text-primary-foreground text-[9px] rounded-lg px-1.5 py-px ml-1 font-mono">{inboxCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 lg:py-4 pb-20 lg:pb-16 animate-fade-up">
          {tab === 'activity' && <ActivityTab client={client} />}
          {tab === 'inbox' && <InboxTab client={client} />}
          {tab === 'sequences' && <SequencesTab client={client} />}
          {tab === 'analytics' && <AnalyticsTab client={client} />}
          {tab === 'config' && <SettingsTab client={client} />}
          {tab === 'connect' && <ConnectTab client={client} />}
        </div>
      </div>

      {showAddModal && <AddClientModal />}
      {confirmDel && <ConfirmDeleteModal />}
    </div>
  );
}
