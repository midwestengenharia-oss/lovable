import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export interface VinculoCompensacao {
  id: string;
  ugi_id: string;
  ucb_id: string;
  percentual: number;
  ativo: boolean;
  data_inicio?: string;
  data_fim?: string;
  observacoes?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useVinculosCompensacao() {
  const queryClient = useQueryClient();

  const { data: vinculos = [], isLoading } = useQuery({
    queryKey: ['vinculos_compensacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vinculos_compensacao')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VinculoCompensacao[];
    }
  });

  const addVinculo = useMutation({
    mutationFn: async (vinculo: Omit<VinculoCompensacao, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('vinculos_compensacao')
        .insert([{ ...vinculo, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculos_compensacao'] });
      toast.success('Vínculo criado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar vínculo: ' + error.message);
    }
  });

  const updateVinculo = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VinculoCompensacao> & { id: string }) => {
      const { data, error } = await supabase
        .from('vinculos_compensacao')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculos_compensacao'] });
      toast.success('Vínculo atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar vínculo: ' + error.message);
    }
  });

  const deleteVinculo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vinculos_compensacao')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculos_compensacao'] });
      toast.success('Vínculo removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover vínculo: ' + error.message);
    }
  });

  return {
    vinculos,
    isLoading,
    addVinculo: addVinculo.mutate,
    updateVinculo: updateVinculo.mutate,
    deleteVinculo: deleteVinculo.mutate,
    isAdding: addVinculo.isPending,
    isUpdating: updateVinculo.isPending,
    isDeleting: deleteVinculo.isPending
  };
}
