import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Projeto } from '@/types/supabase';

export function useProjetos() {
  const queryClient = useQueryClient();

  const { data: projetos = [], isLoading } = useQuery({
    queryKey: ['projetos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Projeto[];
    }
  });

  const addProjeto = useMutation({
    mutationFn: async (projeto: Omit<Projeto, 'id' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('projetos')
        .insert([{ ...projeto, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Projeto criado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar projeto: ' + error.message);
    }
  });

  const updateProjeto = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Projeto> & { id: string }) => {
      const { data, error } = await supabase
        .from('projetos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Projeto atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar projeto: ' + error.message);
    }
  });

  const deleteProjeto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Projeto removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover projeto: ' + error.message);
    }
  });

  return {
    projetos,
    isLoading,
    addProjeto: addProjeto.mutate,
    updateProjeto: updateProjeto.mutate,
    deleteProjeto: deleteProjeto.mutate,
    isAdding: addProjeto.isPending,
    isUpdating: updateProjeto.isPending,
    isDeleting: deleteProjeto.isPending
  };
}
