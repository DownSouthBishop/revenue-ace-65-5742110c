import { useAppStore } from '@/store/appStore';
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

const TABS: { id: TabId; label: string }[] = [
  { id: 'activity', label: 'Activity' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'sequences', label: 'Sequences' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'config', label: 'Settings' },
  { id: 'connect', label: 'Connect' },
];

export default function DashboardPage() {
  const {
    clients, activeClientId, setActiveClientId, tab, setTab,
    sidebarOpen, toggleSidebar, setShowAddModal, showAddModal, confirmDel,
    setPage, smsLog,
  } = useAppStore();

  const client = clients.find(c => c.id === activeClientId) || clients[0];
  if (!client) return null;

  // Count inbox conversations with inbound
  const phones = new Set<string>();
  smsLog.forEach(m => {
    if (m.direction === 'inbound') phones.add(m.from_number);
  });
  const inboxCount = phones.size;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0 bg-2 border-r border-blue flex flex-col transition-all duration-300 overflow-hidden`}>
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
                cl.id === activeClientId
                  ? 'bg-sky-dim border-blue-2'
                  : 'border-transparent hover:bg-s1'
              }`}
            >
              {cl.id === activeClientId && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-sm gradient-indicator" />
              )}
              <div className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center font-display text-sm font-bold flex-shrink-0 border transition-all ${
                cl.id === activeClientId
                  ? 'gradient-sky text-primary-foreground border-primary glow-sky'
                  : 'bg-s2 text-t2 border-blue'
              }`}>
                {cl.name.charAt(0).toUpperCase()}
              </div>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-3.5 border-b border-blue flex items-center justify-between flex-shrink-0 bg-2 relative">
          <div>
            <div className="font-display text-lg font-bold tracking-[.06em] text-foreground">{client.name}</div>
            <div className="text-[11px] font-mono text-t3 mt-0.5">{client.twilio_phone_number} · Respondfall AI Active</div>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-medium tracking-[.08em] bg-success-bg border border-success text-success">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
            SYSTEM ACTIVE
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, hsl(var(--sky-blue)) 30%, hsl(var(--ember)) 70%, transparent)', opacity: 0.22 }} />
        </div>

        {/* Stats row */}
        <div className="px-6 pt-4 grid grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: 'Missed Today', value: String(Math.max(3, Math.floor(Math.random() * 5) + 2)), sub: 'Captured & sequenced', cls: 'text-sky' },
            { label: 'SMS Sent Today', value: String(Math.max(7, Math.floor(Math.random() * 8) + 5)), sub: 'All sequence steps', cls: '' },
            { label: 'Missed · 30 Days', value: '47', sub: '89 SMS total', cls: '' },
            { label: 'Revenue Protected · 30d', value: `$${(47 * client.avg_job_value).toLocaleString()}`, sub: `47 × $${client.avg_job_value}`, cls: 'text-ember' },
          ].map((s, i) => (
            <div key={i} className="bg-s1 border border-blue rounded-xl p-4 relative overflow-hidden group hover:border-blue-2 hover:-translate-y-0.5 transition-all">
              <div className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] mb-2.5">{s.label}</div>
              <div className={`font-display text-[30px] font-bold tracking-[.03em] leading-none ${s.cls}`}>{s.value}</div>
              <div className="text-[10px] text-t3 font-mono mt-1">{s.sub}</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-bar opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3.5 flex-shrink-0">
          <div className="flex gap-0.5 bg-s1 border border-blue rounded-[10px] p-1 w-fit">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`py-1.5 px-4 rounded-[7px] border-none cursor-pointer font-display text-[13px] font-semibold tracking-[.04em] whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'gradient-sky text-primary-foreground glow-sky'
                    : 'bg-transparent text-t3 hover:text-foreground hover:bg-s2'
                }`}
              >
                {t.label}
                {t.id === 'inbox' && inboxCount > 0 && (
                  <span className="inline-block gradient-ember text-primary-foreground text-[9px] rounded-lg px-1.5 py-px ml-1 font-mono">{inboxCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 pb-16 animate-fade-up">
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
