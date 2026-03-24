import React from 'react'
import { EagleLogo } from '../ui/EagleLogo'
import { useAppStore } from '../../stores/app'
import type { Client } from '../../types'

interface Props {
  clients: Client[]
  onLogout: () => void
}

export function Sidebar({ clients, onLogout }: Props) {
  const {
    sidebarOpen, toggleSidebar,
    activeClientId, setActiveClientId,
    setShowAddClientModal,
  } = useAppStore()

  return (
    <div
      className="flex-shrink-0 flex flex-col overflow-hidden transition-all duration-300"
      style={{
        width: sidebarOpen ? 240 : 64,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--b1)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 relative"
        style={{ padding: '16px 14px', borderBottom: '1px solid var(--b1)' }}
      >
        <div style={{ filter: 'drop-shadow(0 0 8px rgba(30,127,212,.6))' }}>
          <EagleLogo size="sm" />
        </div>
        {sidebarOpen && (
          <div>
            <div style={{
              fontFamily: "'Rajdhani'", fontSize: 16, fontWeight: 700,
              letterSpacing: '.06em', whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #d4dde8, #1e7fd4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              RESPONDFALL
            </div>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono'", color: '#4a6080', letterSpacing: '.12em', textTransform: 'uppercase' }}>
              by <span style={{ color: 'var(--ember)' }}>SkyforgeAI</span>
            </div>
          </div>
        )}
        {/* Shimmer line */}
        <div style={{
          position: 'absolute', bottom: 0, left: 14, right: 14, height: 1,
          background: 'linear-gradient(90deg, transparent, var(--blue), transparent)',
          opacity: .35,
        }} />
      </div>

      {/* Section label */}
      {sidebarOpen && (
        <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono'", color: '#2d4060', textTransform: 'uppercase', letterSpacing: '.12em', padding: '12px 16px 6px' }}>
          Client Accounts
        </div>
      )}

      {/* Client list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 8 }}>
        {clients.map(cl => {
          const isActive = cl.id === activeClientId
          return (
            <div
              key={cl.id}
              className="flex items-center gap-2.5 rounded-lg cursor-pointer transition-all duration-150 relative mb-0.5"
              style={{
                padding: '9px 10px',
                border: `1px solid ${isActive ? 'var(--b2)' : 'transparent'}`,
                background: isActive ? 'var(--bluedim)' : 'transparent',
              }}
              onClick={() => setActiveClientId(cl.id)}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--s1)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {/* Active indicator bar */}
              <div style={{
                position: 'absolute', left: 0, top: '50%', transform: `translateY(-50%) scaleY(${isActive ? 1 : 0})`,
                width: 3, height: '60%', borderRadius: '0 2px 2px 0',
                background: 'linear-gradient(180deg, var(--blue), var(--ember))',
                transition: 'transform .2s',
              }} />

              {/* Avatar */}
              <div
                className="flex items-center justify-center flex-shrink-0 rounded-lg transition-all duration-150"
                style={{
                  width: 30, height: 30,
                  fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 700,
                  background: isActive ? 'linear-gradient(135deg, var(--blue3), var(--blue2))' : 'var(--s2)',
                  color: isActive ? '#fff' : '#8fa3be',
                  border: `1px solid ${isActive ? 'var(--blue)' : 'var(--b1)'}`,
                  boxShadow: isActive ? '0 0 10px var(--blueglow)' : 'none',
                }}
              >
                {cl.name.charAt(0).toUpperCase()}
              </div>

              {sidebarOpen && (
                <>
                  <div className="min-w-0 flex-1">
                    <div style={{ fontSize: 12, fontWeight: 500, color: isActive ? 'var(--blue)' : '#e8edf5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cl.name}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: '#4a6080' }}>
                      {cl.twilio_phone_number}
                    </div>
                  </div>
                  <div className="animate-pulse-dot flex-shrink-0 rounded-full" style={{ width: 6, height: 6, background: 'var(--ok)' }} />
                </>
              )}
            </div>
          )
        })}

        {/* Add client */}
        <div
          className="flex items-center gap-2.5 rounded-lg cursor-pointer transition-all duration-150 my-1"
          style={{ padding: '9px 10px', border: '1px dashed var(--b1)', color: '#4a6080', fontSize: 12 }}
          onClick={() => setShowAddClientModal(true)}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'var(--blue)'; el.style.color = 'var(--blue)'; el.style.background = 'var(--bluedim)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'var(--b1)'; el.style.color = '#4a6080'; el.style.background = 'transparent'
          }}
        >
          <div className="flex items-center justify-center flex-shrink-0 rounded-lg" style={{ width: 30, height: 30, fontSize: 18 }}>+</div>
          {sidebarOpen && <span>Add Client</span>}
        </div>
      </div>

      {/* Bottom: profile + controls */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--b1)' }}>
        {sidebarOpen && (
          <div style={{ padding: '8px 10px', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#e8edf5' }}>Agency Owner</div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: 'var(--ember)', letterSpacing: '.06em' }}>SkyforgeAI Partner</div>
          </div>
        )}
        <div className="flex gap-1">
          <button
            className="flex-1 rounded-md cursor-pointer transition-all duration-150"
            style={{ background: 'transparent', border: '1px solid var(--b1)', color: '#4a6080', padding: 6, fontSize: 11, fontFamily: "'JetBrains Mono'" }}
            onClick={toggleSidebar}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          {sidebarOpen && (
            <button
              className="flex-1 rounded-md cursor-pointer transition-all duration-150"
              style={{ background: 'transparent', border: '1px solid var(--b1)', color: '#4a6080', padding: 6, fontSize: 11, fontFamily: "'JetBrains Mono'" }}
              onClick={onLogout}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
