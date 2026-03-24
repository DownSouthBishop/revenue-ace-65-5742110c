import React from 'react'
import { useAppStore } from '../../stores/app'

interface Props {
  onConfirm: (type: string, id: string) => void
}

export function ConfirmDelete({ onConfirm }: Props) {
  const { showConfirmDelete, setShowConfirmDelete } = useAppStore()
  if (!showConfirmDelete) return null
  const { type, id, label } = showConfirmDelete

  const dismiss = () => setShowConfirmDelete(null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(5,7,13,.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && dismiss()}
    >
      <div
        className="relative rounded-2xl overflow-hidden w-full max-w-sm animate-fade-up"
        style={{ background: 'var(--s1)', border: '1px solid var(--errb)' }}
      >
        {/* Red top bar */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, var(--err), rgba(232,64,64,.4))' }} />

        <div className="p-7">
          <div
            className="mb-1"
            style={{ fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, letterSpacing: '.06em', color: 'var(--err)' }}
          >
            🗑 Confirm Delete
          </div>
          <div style={{ fontSize: 13, color: '#8fa3be', lineHeight: 1.7, marginBottom: 20 }}>
            Are you sure you want to delete <strong style={{ color: '#e8edf5' }}>{label}</strong>? This cannot be undone.
          </div>
          <div className="flex gap-2.5">
            <button className="sf-btn-ghost flex-1" onClick={dismiss}>Cancel</button>
            <button
              className="sf-btn flex-1"
              style={{ background: 'var(--err)', color: '#fff', boxShadow: '0 0 16px rgba(232,64,64,.3)' }}
              onClick={() => { onConfirm(type, id); dismiss() }}
            >
              DELETE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
