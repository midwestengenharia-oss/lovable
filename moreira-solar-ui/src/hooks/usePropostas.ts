import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Proposta } from '@/types/supabase';

export function usePropostas() {
  const queryClient = useQueryClient();

  const { data: propostas = [], isLoading } = useQuery({
    queryKey: ['propostas'],
    queryFn: async () => {
      const res = await fetch('/api/propostas', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar propostas');
      return (await res.json()) as Proposta[];
    }
  });

  const addProposta = useMutation({
    mutationFn: async (proposta: Omit<Proposta, 'id' | 'user_id'>) => {
      const res = await fetch('/api/propostas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(proposta),
      });
      if (!res.ok) throw new Error('Erro ao criar proposta');
      return await res.json();
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
      const res = await fetch(`/api/propostas/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Erro ao atualizar proposta');
      return await res.json();
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
      const res = await fetch(`/api/propostas/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao remover proposta');
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
