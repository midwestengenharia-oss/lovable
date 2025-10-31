import { ReactNode, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

interface ProtectedRouteProps {
  children: ReactNode;
  modulo?: string;
  acao?: "visualizar" | "criar" | "editar" | "excluir";
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [state, setState] = useState<'loading' | 'ok' | 'unauth'>('loading');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await apiGet<{ authenticated: boolean }>("/api/auth/session");
      if (!mounted) return;
      if (res.ok && res.data.authenticated) setState('ok');
      else setState('unauth');
    })();
    return () => { mounted = false; };
  }, []);

  if (state === 'loading') {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }
  if (state === 'unauth') {
    window.location.href = '/login';
    return null;
  }
  return <>{children}</>;
}

