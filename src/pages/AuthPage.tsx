import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { EagleLogo } from '@/components/EagleLogo';
import { supabase } from '@/integrations/supabase/client';

export default function AuthPage() {
  const { authMode, setAuthMode } = useAppStore();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    setErr('');
    setMsg('');
    if (!email.trim()) {
      setErr('Email is required.');
      return;
    }
    if (authMode !== 'magic' && !pass) {
      setErr('Password is required.');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        // Index.tsx handles routing via onAuthStateChange
      } else if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        setMsg('Account created! Entering platform...');
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        setMsg(`Magic link sent to ${email}. Check your inbox.`);
      }
    } catch (e: unknown) {
      const err = e as { code?: string; error_code?: string; message?: string };
      const code = err?.code || err?.error_code || '';
      const raw = (err?.message || '').toLowerCase();
      let friendly = err?.message || 'Authentication failed. Please try again.';
      if (code === 'invalid_credentials' || raw.includes('invalid login credentials')) {
        friendly = 'Email or password is incorrect.';
      } else if (code === 'email_not_confirmed' || raw.includes('email not confirmed')) {
        friendly = 'Please check your email and confirm your account first.';
      } else if (
        code === 'over_email_send_rate_limit' ||
        raw.includes('rate limit') ||
        raw.includes('too many')
      ) {
        friendly = 'Too many attempts — please wait a few minutes.';
      }
      setErr(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-6 sm:mb-8 animate-fade-up">
          <div className="flex justify-center mb-3.5">
            <EagleLogo size="lg" />
          </div>
          <div className="font-display text-[26px] sm:text-[30px] font-bold tracking-[.1em] text-gradient-brand">
            RESPOND
            <span
              style={{
                background: 'linear-gradient(135deg, #1e7fd4, #6ec6ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              FALL
            </span>
          </div>
          <div className="text-[10px] font-mono text-t3 tracking-[.1em] uppercase mt-1">
            Missed Call Revenue Recovery
          </div>
        </div>

        <div
          className="bg-s1 border border-blue rounded-2xl p-5 sm:p-7 relative overflow-hidden"
          style={{ animation: 'fadeUp 0.6s ease 0.1s both' }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 gradient-shimmer" />

          <div className="flex gap-1 mb-5 bg-3 border border-blue rounded-[10px] p-1">
            {(['signin', 'signup', 'magic'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setAuthMode(mode);
                  setErr('');
                  setMsg('');
                }}
                className={`flex-1 py-2 rounded-[7px] border-none cursor-pointer font-display text-[12px] sm:text-[13px] font-semibold tracking-[.04em] transition-all duration-200 ${
                  authMode === mode
                    ? 'gradient-sky text-primary-foreground glow-sky'
                    : 'bg-transparent text-t3'
                }`}
              >
                {mode === 'signin' ? 'SIGN IN' : mode === 'signup' ? 'SIGN UP' : 'MAGIC LINK'}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3.5">
            {authMode === 'signup' && (
              <div>
                <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">
                  Full Name
                </label>
                <input
                  className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-3 outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--sky-dim))]"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">
                Email
              </label>
              <input
                className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-3 outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--sky-dim))]"
                placeholder="you@company.com"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            {authMode !== 'magic' && (
              <div>
                <label className="text-[10px] font-mono text-t3 uppercase tracking-[.1em] block mb-1.5">
                  Password
                </label>
                <input
                  className="w-full bg-3 border border-blue rounded-lg text-foreground font-body text-[13px] px-3 py-3 outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--sky-dim))]"
                  placeholder="••••••••"
                  type="password"
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            )}
            {msg && (
              <div className="bg-success-bg border border-success rounded-lg p-2.5 text-[12px] text-success">
                ✓ {msg}
              </div>
            )}
            {err && (
              <div className="bg-[hsl(var(--destructive)/0.08)] border border-destructive/40 rounded-lg p-2.5 text-[12px] text-destructive">
                ⚠ {err}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 gradient-sky text-primary-foreground border-none rounded-lg cursor-pointer font-display text-[15px] font-bold tracking-[.1em] uppercase glow-sky transition-all hover:shadow-[0_0_36px_rgba(30,127,212,0.5)] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-1.5 active:scale-[0.98]"
            >
              {loading
                ? '◌ AUTHENTICATING...'
                : authMode === 'magic'
                  ? '✉ SEND MAGIC LINK'
                  : authMode === 'signup'
                    ? 'CREATE ACCOUNT'
                    : 'SIGN IN'}
            </button>
          </div>
        </div>

        <div
          className="text-center mt-4 text-[11px] font-mono text-t3 tracking-[.06em]"
          style={{ animation: 'fadeUp 0.6s ease 0.2s both' }}
        >
          Missed Call Revenue Recovery · Built for Service Businesses
          <div className="mt-2 flex justify-center gap-3 text-[10px]">
            <a href="/terms" className="text-t3 hover:text-sky">
              Terms
            </a>
            <a href="/privacy" className="text-t3 hover:text-sky">
              Privacy
            </a>
            <a href="/sms-consent" className="text-t3 hover:text-sky">
              SMS Consent
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
