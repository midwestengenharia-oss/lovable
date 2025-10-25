import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Cobranca } from '@/types/supabase';

export function useCobrancas() {
  const queryClient = useQueryClient();

  const { data: cobrancas = [], isLoading } = useQuery({
    queryKey: ['cobrancas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cobrancas')
        .select('*')
        .order('vencimento', { ascending: true });
      
      if (error) throw error;
      return data as Cobranca[];
    }
  });

  const addCobranca = useMutation({
    mutationFn: async (cobranca: Omit<Cobranca, 'id' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('cobrancas')
        .insert([{ ...cobranca, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança criada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar cobrança: ' + error.message);
    }
  });

  const updateCobranca = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cobranca> & { id: string }) => {
      const { data, error } = await supabase
        .from('cobrancas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar cobrança: ' + error.message);
    }
  });

  const deleteCobranca = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cobrancas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast.success('Cobrança removida com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover cobrança: ' + error.message);
    }
  });

  return {
    cobrancas,
    isLoading,
    addCobranca: addCobranca.mutate,
    updateCobranca: updateCobranca.mutate,
    deleteCobranca: deleteCobranca.mutate,
    isAdding: addCobranca.isPending,
    isUpdating: updateCobranca.isPending,
    isDeleting: deleteCobranca.isPending
  };
}
