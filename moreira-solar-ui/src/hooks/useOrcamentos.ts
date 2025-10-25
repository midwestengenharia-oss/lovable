import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Orcamento } from '@/types/supabase';

export function useOrcamentos() {
  const queryClient = useQueryClient();

  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as Orcamento[];
    }
  });

  const addOrcamento = useMutation({
    mutationFn: async (orcamento: Omit<Orcamento, 'id' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('orcamentos')
        .insert([{ ...orcamento, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento criado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar orçamento: ' + error.message);
    }
  });

  const updateOrcamento = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Orcamento> & { id: string }) => {
      const { data, error } = await supabase
        .from('orcamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar orçamento: ' + error.message);
    }
  });

  const deleteOrcamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover orçamento: ' + error.message);
    }
  });

  return {
    orcamentos,
    isLoading,
    addOrcamento: addOrcamento.mutate,
    updateOrcamento: updateOrcamento.mutate,
    deleteOrcamento: deleteOrcamento.mutate,
    isAdding: addOrcamento.isPending,
    isUpdating: updateOrcamento.isPending,
    isDeleting: deleteOrcamento.isPending
  };
}
