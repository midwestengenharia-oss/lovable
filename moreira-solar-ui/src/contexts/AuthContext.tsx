import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

type Perfil = "admin" | "gestor" | "vendedor";

interface SessionUser {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo?: boolean;
  gestor_id?: string | null;
}

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  // Keep signatures compatible where used
  signUp: (
    email: string,
    _password: string,
    nome: string,
    perfil?: Perfil
  ) => Promise<{ user?: { id: string }; error: any | null; tempPassword?: string }>;
  signIn: () => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.ok) {
          const me = (await res.json()) as SessionUser;
          if (mounted) setUser(me);
        } else if (res.status === 401) {
          if (mounted) setUser(null);
        }
      } catch (e) {
        console.error("auth/session_load_failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const signUp = async (
    email: string,
    _password: string,
    nome: string,
    perfil: Perfil = "vendedor"
  ): Promise<{ user?: { id: string }; error: any | null; tempPassword?: string }> => {
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, nome, perfil, password: _password }),
      });
      if (!res.ok) {
        let err: any = null;
        try {
          err = await res.json();
        } catch {}
        return { error: err || { message: "usuarios_create_failed" } };
      }
      const created = (await res.json()) as { id: string; tempPassword?: string };
      toast.success("Usuario criado com sucesso.");
      return { user: { id: created.id }, error: null, tempPassword: created.tempPassword };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signIn = async (): Promise<{ error: any | null }> => {
    try {
      window.location.href = "/login";
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("logout_failed", e);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}




