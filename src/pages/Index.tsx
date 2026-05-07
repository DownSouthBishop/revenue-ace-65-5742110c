import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import AuthPage from '@/pages/AuthPage';
import OnboardPage from '@/pages/OnboardPage';
import DashboardPage from '@/pages/DashboardPage';

const Index = () => {
  const page = useAppStore((s) => s.page);
  const setPage = useAppStore((s) => s.setPage);
  const loadClients = useAppStore((s) => s.loadClients);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleSession = async (session: Session | null) => {
      if (!session) {
        useAppStore.setState({ clients: [], activeClientId: '' });
        setPage('auth');
        return;
      }
      await loadClients();
      const clients = useAppStore.getState().clients;
      setPage(clients.length > 0 ? 'dashboard' : 'onboard');
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => handleSession(session), 0);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleSession(session);
      setChecking(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [setPage, loadClients]);

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
