import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  modulo: string;
  acao?: "visualizar" | "criar" | "editar" | "excluir";
}

export function ProtectedRoute({ children, modulo, acao = "visualizar" }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  // Por enquanto, permitir acesso a todos os módulos para usuários autenticados
  // TODO: Implementar sistema de permissões baseado no Supabase
  return <>{children}</>;
}
