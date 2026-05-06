import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPasswordPage() {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places the recovery session in URL hash; client picks it up automatically.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setReady(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg('');
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) setErr(error.message);
    else { setMsg('Password updated. You can now sign in.'); setTimeout(() => { window.location.href = '/'; }, 1500); }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-[380px] bg-s1 border border-blue rounded-2xl p-6">
        <div className="font-display text-lg font-bold tracking-[.06em] mb-4">Reset Password</div>
        {!ready && <div className="text-[12px] text-t3 font-mono mb-3">Open the recovery link from your email to continue.</div>}
        <input
          type="password"
          minLength={8}
          required
          placeholder="New password"
          className="w-full bg-3 border border-blue rounded-lg text-foreground text-[13px] px-3 py-2.5 outline-none focus:border-primary mb-3"
          value={pw}
          onChange={e => setPw(e.target.value)}
          disabled={!ready}
        />
        <button disabled={!ready} className="w-full py-2.5 rounded-lg gradient-sky text-primary-foreground font-display text-sm font-bold tracking-[.06em] uppercase glow-sky disabled:opacity-50">
          Update password
        </button>
        {err && <div className="text-[12px] text-destructive mt-3">{err}</div>}
        {msg && <div className="text-[12px] text-success mt-3">{msg}</div>}
      </form>
    </div>
  );
}
