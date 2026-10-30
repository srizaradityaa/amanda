export const LOGIN_PATH = '/login';
export const PORTAL_PATH = '/portal';
export const KEASLIAN_BASE = '/keaslian';
export const APP_BASE = '/app';
export const DEFAULT_MODULE_ID = 'dashboard';
export const DEFAULT_APP_PATH = `${APP_BASE}/${DEFAULT_MODULE_ID}`;

export type AppRoute =
  | { kind: 'login' }
  | { kind: 'portal' }
  | { kind: 'keaslian'; token: string }
  | { kind: 'app'; moduleId: string }
  | { kind: 'unknown' };

export function appPath(moduleId: string): string {
  return `${APP_BASE}/${moduleId}`;
}

export function parseRoute(pathname: string): AppRoute {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === LOGIN_PATH) return { kind: 'login' };
  if (path === PORTAL_PATH) return { kind: 'portal' };
  if (path.startsWith(`${KEASLIAN_BASE}/`)) {
    const token = path.slice(KEASLIAN_BASE.length + 1);
    if (token && !token.includes('/')) return { kind: 'keaslian', token };
  }
  if (path === APP_BASE) return { kind: 'app', moduleId: DEFAULT_MODULE_ID };
  if (path.startsWith(`${APP_BASE}/`)) {
    const moduleId = path.slice(APP_BASE.length + 1);
    if (moduleId && !moduleId.includes('/')) return { kind: 'app', moduleId };
  }
  return { kind: 'unknown' };
}


export { parseRoute }