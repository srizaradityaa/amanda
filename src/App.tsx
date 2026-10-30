import { useEffect } from 'react';
import { useAuthSession } from '@/auth/mockAuth';
import { LoginPage } from '@/pages/LoginPage';
import { MainLayout } from '@/components/MainLayout';
import { PublicPortalPlaceholder } from '@/pages/PublicPortalPlaceholder';
import { KeaslianSpjPage } from '@/pages/KeaslianSpjPage';
import { SelectAssignmentPage } from '@/pages/SelectAssignmentPage';
import { useRouter } from '@/router/useRouter';
import {
  DEFAULT_APP_PATH,
  DEFAULT_MODULE_ID,
  LOGIN_PATH,
  PORTAL_PATH,
  appPath,
} from '@/router/routes';

export default function App() {
  const { session, login, logout, selectAssignment } = useAuthSession();
  const { route, navigate } = useRouter();

  useEffect(() => {
    if (route.kind === 'portal' || route.kind === 'keaslian') return;
    if (!session && route.kind === 'unknown') navigate(LOGIN_PATH, { replace: true });
    if (session && route.kind !== 'app') navigate(DEFAULT_APP_PATH, { replace: true });
  }, [session, route.kind, navigate]);

  if (route.kind === 'keaslian') {
    return <KeaslianSpjPage token={route.token} onBack={() => navigate(LOGIN_PATH)} />;
  }

  if (route.kind === 'portal') {
    return <PublicPortalPlaceholder onBack={() => navigate(LOGIN_PATH)} />;
  }

  if (!session) {
    return (
      <LoginPage
        onLogin={(id, pw) => login(id, pw) !== null}
        onOpenPublicPortal={() => navigate(PORTAL_PATH)}
      />
    );
  }

  function handleLogout() {
    logout();
    navigate(LOGIN_PATH, { replace: true });
  }

  if (!session.activeTa) {
    return (
      <SelectAssignmentPage user={session} onSelect={selectAssignment} onLogout={handleLogout} />
    );
  }

  return (
    <MainLayout
      session={session}
      moduleId={route.kind === 'app' ? route.moduleId : DEFAULT_MODULE_ID}
      onNavigate={(id) => navigate(appPath(id))}
      onLogout={handleLogout}
    />
  );
}
