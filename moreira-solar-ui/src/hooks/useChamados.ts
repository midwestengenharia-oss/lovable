import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export interface Chamado {
  id: string;
  numero: string;
  cliente: string;
  projeto_id?: string;
  tipo: 'Manutenção' | 'Garantia' | 'Suporte' | 'Limpeza';
  prioridade: 'Baixa' | 'Média' | 'Alta';
  status: 'Onboarding' | 'Ativo' | 'Manutenção' | 'Chamado' | 'Finalizado';
  descricao: string;
  data: string;
  tecnico?: string;
  avatar?: string;
  historico?: any[];
  fotos?: any[];
  resolucao?: string;
  data_finalizacao?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

function genNumeroChamado(prefix = "PV") {
  const d = new Date();
  const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${yyyymm}-${rand}`;
}

// Normaliza qualquer coisa em objeto simples
function ensureObject<T extends object = Record<string, any>>(v: any): T {
  if (Array.isArray(v)) return (v[0] ?? {}) as T;
  if (typeof v === "string") {
    try { return JSON.parse(v) as T; } catch { return {} as T; }
  }
  return (v ?? {}) as T;
}

export function useChamados() {
  const queryClient = useQueryClient();

  const { data: chamados = [], isLoading } = useQuery({
    queryKey: ['chamados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chamados')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return data as Chamado[];
    }
  });

  // ---- CREATE
  const addChamadoMutation = useMutation({
    mutationFn: async (chamado: Omit<Chamado, 'id' | 'user_id' | 'numero'> & { numero?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // garante numero único (se banco não gerar)
      let numero = chamado.numero || genNumeroChamado();

      // tenta inserir; se colidir, regenera uma única vez
      let { data, error } = await supabase
        .from('chamados')
        .insert([{ ...chamado, numero, user_id: user.id }])
        .select()
        .single();

      if (error && String(error.message).includes('chamados_numero_key')) {
        numero = genNumeroChamado();
        const retry = await supabase
          .from('chamados')
          .insert([{ ...chamado, numero, user_id: user.id }])
          .select()
          .single();
        data = retry.data as any;
        error = retry.error as any;
      }

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamados'] });
      toast.success('Chamado criado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar chamado: ' + error.message);
    }
  });

  // ---- UPDATE (mutation “crua” que recebe um único objeto)
  const updateChamadoMutation = useMutation({
    mutationFn: async (payload: Partial<Chamado> & { id: string }) => {
      const { id, ...rest } = payload;
      const safe = ensureObject(rest);

      const { data, error } = await supabase
        .from('chamados')
        .update(safe)         // 👈 sem colchetes
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamados'] });
      toast.success('Chamado atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar chamado: ' + error.message);
    }
  });

  // ---- DELETE
  const deleteChamadoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chamados').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamados'] });
      toast.success('Chamado removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover chamado: ' + error.message);
    }
  });

  // ---- Wrappers amigáveis (mantém sua forma de uso atual)
  const addChamado = (dados: Omit<Chamado, 'id' | 'user_id' | 'numero'> & { numero?: string }) =>
    addChamadoMutation.mutate(dados);

  const updateChamado = (id: string, patch: Partial<Chamado> | string | any[]) =>
    updateChamadoMutation.mutate({ id, ...ensureObject(patch) });

  const deleteChamado = (id: string) =>
    deleteChamadoMutation.mutate(id);

  return {
    chamados,
    isLoading,
    addChamado,
    updateChamado,
    deleteChamado,
    isAdding: addChamadoMutation.isPending,
    isUpdating: updateChamadoMutation.isPending,
    isDeleting: deleteChamadoMutation.isPending,
  };
}
