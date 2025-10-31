import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type Session = { authenticated: boolean; user?: { sub: string; name?: string; email?: string; roles?: string[] } };

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'ok' | 'unauth'>('loading');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await apiGet<Session>('/api/auth/session');
      if (!mounted) return;
      setState(res.ok && res.data.authenticated ? 'ok' : 'unauth');
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (state === 'loading') return <div className="p-6 text-sm text-muted-foreground">Verificando sessão…</div>;
  if (state === 'unauth') {
    // Redirect to SSO login
    window.location.href = '/login';
    return null;
  }
  return <>{children}</>;
}



