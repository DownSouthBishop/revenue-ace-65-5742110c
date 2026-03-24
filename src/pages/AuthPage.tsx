import React, { useState } from 'react'
import { EagleLogo } from '../components/ui/EagleLogo'
import { auth } from '../lib/supabase'

type Mode = 'signin' | 'signup' | 'magic'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const submit = async () => {
    setLoading(true); setErr(''); setMsg('')
    try {
      if (mode === 'magic') {
        const { error } = await auth.magicLink(email)
        if (error) throw error
        setMsg('Magic link sent! Check your email inbox.')
      } else if (mode === 'signup') {
        const { error } = await auth.signUp(email, password, name)
        if (error) throw error
        setMsg('Account created! Check your email to confirm.')
      } else {
        const { error } = await auth.signIn(email, password)
        if (error) throw error
      }
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Brand */}
        <div className="text-center mb-8 animate-fade-up">
          <div
            className="inline-block mb-3.5 animate-float"
            style={{ filter: 'drop-shadow(0 0 16px rgba(30,127,212,.55)) drop-shadow(0 0 8px rgba(232,98,26,.35))' }}
          >
            <EagleLogo size="lg" />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, fontWeight: 600, letterSpacing: '.2em', color: '#4a6080', textTransform: 'uppercase', marginBottom: 8 }}>
            A SkyforgeAI Platform
          </div>
          <div style={{
            fontFamily: "'Rajdhani'", fontSize: 30, fontWeight: 700, letterSpacing: '.1em',
            background: 'linear-gradient(135deg, #d4dde8, #1e7fd4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            RESPONDFALL{' '}
            <span style={{ background: 'linear-gradient(135deg, #1e7fd4, #6ec6ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#8fa3be', marginTop: 6 }}>
            Missed call → AI-powered revenue recovery
          </div>
        </div>

        {/* Card */}
        <div
          className="relative rounded-2xl overflow-hidden animate-fade-up"
          style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: 28, animationDelay: '.1s' }}
        >
          {/* Shimmer top */}
          <div
            className="absolute top-0 left-0 right-0 animate-shimmer"
            style={{ height: 2, background: 'linear-gradient(90deg, var(--blue3), var(--blue), var(--ember), var(--blue3))', backgroundSize: '200% 100%' }}
          />

          {/* Mode switcher */}
          <div
            className="flex gap-1 rounded-xl mb-5"
            style={{ background: 'var(--bg3)', border: '1px solid var(--b1)', padding: 4 }}
          >
            {(['signin', 'signup', 'magic'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(''); setMsg('') }}
                className="flex-1 rounded-lg transition-all duration-200"
                style={{
                  padding: '8px 0', border: 'none', cursor: 'pointer',
                  fontFamily: "'Rajdhani'", fontSize: 13, fontWeight: 600, letterSpacing: '.04em',
                  background: mode === m ? 'linear-gradient(135deg, var(--blue3), var(--blue2))' : 'transparent',
                  color: mode === m ? '#fff' : '#4a6080',
                  boxShadow: mode === m ? '0 0 12px var(--blueglow)' : 'none',
                }}
              >
                {m === 'signin' ? 'Sign In' : m === 'signup' ? 'Sign Up' : '✦ Magic Link'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="flex flex-col gap-3.5">
            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="sf-label">Full Name</label>
                <input className="sf-input" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="sf-label">Email Address</label>
              <input className="sf-input" type="email" placeholder="you@agency.com" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
            {mode !== 'magic' && (
              <div className="flex flex-col gap-1.5">
                <label className="sf-label">Password</label>
                <input className="sf-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()} />
              </div>
            )}

            {err && <div className="sf-alert sf-alert-err">{err}</div>}
            {msg && <div className="sf-alert sf-alert-ok">{msg}</div>}

            <button
              className="sf-btn-primary w-full"
              style={{ padding: 13, fontSize: 15, justifyContent: 'center', marginTop: 6 }}
              onClick={submit}
              disabled={loading}
            >
              {loading
                ? <span className="animate-spin-slow">◌</span>
                : mode === 'magic' ? 'SEND MAGIC LINK'
                : mode === 'signin' ? 'ACCESS PLATFORM →'
                : 'CREATE ACCOUNT →'}
            </button>
          </div>
        </div>

        <div
          className="text-center mt-4 animate-fade-up"
          style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: '#4a6080', letterSpacing: '.06em', animationDelay: '.2s' }}
        >
          <span style={{ color: 'var(--ember)' }}>SkyforgeAI</span> · Agency Revenue Intelligence Platform
        </div>
      </div>
    </div>
  )
}
