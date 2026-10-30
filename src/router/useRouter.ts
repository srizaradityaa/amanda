import { useCallback, useEffect, useState } from 'react';
import { parseRoute } from '@/router/routes';

interface NavigateOptions {
  replace?: boolean;
}

export function useRouter() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string, options?: NavigateOptions) => {
    if (window.location.pathname === path) return;
    if (options?.replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    setPathname(path);
  }, []);

  return { route: parseRoute(pathname), navigate };
}
