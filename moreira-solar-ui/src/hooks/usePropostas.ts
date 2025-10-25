import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Proposta } from '@/types/supabase';

export function usePropostas() {
  const queryClient = useQueryClient();

  const { data: propostas = [], isLoading } = useQuery({
    queryKey: ['propostas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as Proposta[];
    }
  });

  const addProposta = useMutation({
    mutationFn: async (proposta: Omit<Proposta, 'id' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('propostas')
        .insert([{ ...proposta, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta criada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar proposta: ' + error.message);
    }
  });

  const updateProposta = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Proposta> & { id: string }) => {
      const { data, error } = await supabase
        .from('propostas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar proposta: ' + error.message);
    }
  });

  const deleteProposta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('propostas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta removida com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover proposta: ' + error.message);
    }
  });

  return {
    propostas,
    isLoading,
    addProposta: addProposta.mutate,
    updateProposta: updateProposta.mutate,
    deleteProposta: deleteProposta.mutate,
    isAdding: addProposta.isPending,
    isUpdating: updateProposta.isPending,
    isDeleting: deleteProposta.isPending
  };
}
