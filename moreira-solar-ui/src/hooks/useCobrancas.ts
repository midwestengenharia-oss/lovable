import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Cobranca } from '@/types/supabase';
import { apiGet } from '@/lib/api';

export function useCobrancas() {
  const queryClient = useQueryClient();

  const { data: cobrancas = [], isLoading } = useQuery({
    queryKey: ['cobrancas'],
    queryFn: async () => {
      const res = await apiGet<Cobranca[]>(`/api/cobrancas`);
      if (!res.ok) throw new Error('Falha ao carregar cobranças');
      return res.data;
    }
  });

  const addCobranca = useMutation({
    mutationFn: async (_cobranca: Omit<Cobranca, 'id' | 'user_id'>) => {
      throw new Error('Criação de cobrança não suportada via BFF ainda');
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
      const res = await fetch(`/api/cobrancas/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Falha ao atualizar cobrança');
      return await res.json();
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
    mutationFn: async (_id: string) => {
      throw new Error('Remoção de cobrança não suportada via BFF ainda');
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

