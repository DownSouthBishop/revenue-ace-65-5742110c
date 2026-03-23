import { useAppStore } from '@/store/appStore';
import AuthPage from '@/pages/AuthPage';
import OnboardPage from '@/pages/OnboardPage';
import DashboardPage from '@/pages/DashboardPage';

const Index = () => {
  const page = useAppStore(s => s.page);

  if (page === 'auth') return <AuthPage />;
  if (page === 'onboard') return <OnboardPage />;
  return <DashboardPage />;
};

export default Index;
