import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

// Tipo baseado no AppContext - adaptar conforme schema do Supabase
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

  const addChamado = useMutation({
    mutationFn: async (chamado: Omit<Chamado, 'id' | 'user_id' | 'numero'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('chamados')
        .insert([{ ...chamado, user_id: user.id }])
        .select()
        .single();

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

  const updateChamado = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Chamado> & { id: string }) => {
      const { data, error } = await supabase
        .from('chamados')
        .update(updates)
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

  const deleteChamado = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chamados')
        .delete()
        .eq('id', id);

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

  return {
    chamados,
    isLoading,
    addChamado: addChamado.mutate,
    updateChamado: updateChamado.mutate,
    deleteChamado: deleteChamado.mutate,
    isAdding: addChamado.isPending,
    isUpdating: updateChamado.isPending,
    isDeleting: deleteChamado.isPending
  };
}
