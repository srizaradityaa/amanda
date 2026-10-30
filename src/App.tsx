import { useState } from 'react';
import { useAuthSession } from '@/auth/mockAuth';
import { LoginPage } from '@/pages/LoginPage';
import { MainLayout } from '@/components/MainLayout';
import { PublicPortalPlaceholder } from '@/pages/PublicPortalPlaceholder';

export default function App() {
  const { session, login, logout } = useAuthSession();
  const [view, setView] = useState<'app' | 'public'>('app');

  if (view === 'public' && !session) {
    return <PublicPortalPlaceholder onBack={() => setView('app')} />;
  }

  if (!session) {
    return (
      <LoginPage
        onLogin={(id, pw) => login(id, pw) !== null}
        onOpenPublicPortal={() => setView('public')}
      />
    );
  }

  return <MainLayout session={session} onLogout={logout} />;
}
