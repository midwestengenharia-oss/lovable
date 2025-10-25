import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    nome: string,
    perfil?: "admin" | "gestor" | "vendedor"
  ) => Promise<{ error: any }>;
  signIn: (
    email: string,
    password: string,
    options?: { lembrar?: boolean }
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Monitora sessão do Supabase
  useEffect(() => {
    const publicPaths = ["/auth", "/cadastroCliente"];
    const currentPath = window.location.pathname;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // 🚫 Evita travar rotas públicas quando o usuário não está logado
      if (!session && publicPaths.includes(currentPath)) {
        setLoading(false);
        return;
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🕒 Logout automático por inatividade (30 min)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        toast.info("Sessão encerrada por inatividade.");
        window.location.href = "/auth";
      }, 30 * 60 * 1000); // 30 minutos
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);

  // 🧩 Cadastro de usuário
  const signUp = async (
    email: string,
    password: string,
    nome: string,
    perfil: "admin" | "gestor" | "vendedor" = "vendedor"
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { nome, perfil },
        },
      });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // 🧠 Login com controle de persistência ("lembrar-me")
  const signIn = async (
    email: string,
    password: string,
    options?: { lembrar?: boolean }
  ) => {
    try {
      const storage = options?.lembrar ? localStorage : sessionStorage;

      // Limpa sessão anterior
      await supabase.auth.signOut();

      // ⚙️ Força storage coerente
      Object.defineProperty(supabase.auth, "_storage", {
        value: storage,
        writable: true,
      });

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  // 🚪 Logout global
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao encerrar sessão.");
    } else {
      toast.success("Sessão encerrada com sucesso!");
      window.location.href = "/auth";
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut }}
    >
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
