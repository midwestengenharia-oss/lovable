import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Projeto } from '@/types/supabase';

export function useProjetos() {
  const queryClient = useQueryClient();

  const { data: projetos = [], isLoading } = useQuery({
    queryKey: ['projetos'],
    queryFn: async () => {
      const res = await fetch('/api/projetos', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar projetos');
      return (await res.json()) as Projeto[];
    }
  });

  const addProjeto = useMutation({
    mutationFn: async (projeto: Omit<Projeto, 'id' | 'user_id'>) => {
      const res = await fetch('/api/projetos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(projeto),
      });
      if (!res.ok) throw new Error('Erro ao criar projeto');
      return await res.json();
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
      const res = await fetch(`/api/projetos/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Erro ao atualizar projeto');
      return await res.json();
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
      const res = await fetch(`/api/projetos/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao remover projeto');
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
