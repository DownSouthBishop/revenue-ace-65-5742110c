import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import AuthPage from '@/pages/AuthPage';
import OnboardPage from '@/pages/OnboardPage';
import DashboardPage from '@/pages/DashboardPage';

const Index = () => {
  const page = useAppStore(s => s.page);
  const setPage = useAppStore(s => s.setPage);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Subscribe FIRST so we never miss an event
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setPage('auth');
        return;
      }
      // Defer DB call to avoid deadlocking inside the listener
      setTimeout(async () => {
        const { data: clientRows } = await supabase
          .from('clients')
          .select('id')
          .eq('owner_id', session.user.id)
          .limit(1);
        setPage((clientRows?.length ?? 0) > 0 ? 'dashboard' : 'onboard');
      }, 0);
    });

    // Then check the existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setPage('auth');
        setChecking(false);
        return;
      }
      const { data: clientRows } = await supabase
        .from('clients')
        .select('id')
        .eq('owner_id', session.user.id)
        .limit(1);
      setPage((clientRows?.length ?? 0) > 0 ? 'dashboard' : 'onboard');
      setChecking(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [setPage]);

  if (checking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-t3 font-mono text-xs tracking-[.1em] animate-pulse">◌ LOADING...</div>
      </div>
    );
  }

  if (page === 'auth') return <AuthPage />;
  if (page === 'onboard') return <OnboardPage />;
  return <DashboardPage />;
};

export default Index;
