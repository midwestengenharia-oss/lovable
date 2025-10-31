import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Orcamento } from '@/types/supabase';

export function useOrcamentos() {
  const queryClient = useQueryClient();

  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      const res = await fetch('/api/orcamentos', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar orçamentos');
      return (await res.json()) as Orcamento[];
    },
  });

  const addOrcamento = useMutation({
    mutationFn: async (orcamento: Omit<Orcamento, 'id' | 'user_id'>) => {
      const res = await fetch('/api/orcamentos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(orcamento),
      });
      if (!res.ok) throw new Error('Erro ao criar orçamento');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento criado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar orçamento: ' + error.message);
    },
  });

  const updateOrcamento = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Orcamento> & { id: string }) => {
      const res = await fetch(`/api/orcamentos/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Erro ao atualizar orçamento');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar orçamento: ' + error.message);
    },
  });

  const deleteOrcamento = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orcamentos/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao remover orçamento');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover orçamento: ' + error.message);
    },
  });

  return {
    orcamentos,
    isLoading,
    addOrcamento: addOrcamento.mutate,
    updateOrcamento: updateOrcamento.mutate,
    deleteOrcamento: deleteOrcamento.mutate,
    isAdding: addOrcamento.isPending,
    isUpdating: updateOrcamento.isPending,
    isDeleting: deleteOrcamento.isPending,
  };
}

