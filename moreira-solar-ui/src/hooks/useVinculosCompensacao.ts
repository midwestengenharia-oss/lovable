import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// BFF endpoints
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
      const res = await fetch('/api/vinculos-compensacao', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar vínculos');
      return (await res.json()) as VinculoCompensacao[];
    }
  });

  const addVinculo = useMutation({
    mutationFn: async (vinculo: Omit<VinculoCompensacao, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const res = await fetch('/api/vinculos-compensacao', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(vinculo) });
      if (!res.ok) throw new Error('Falha ao criar vínculo');
      return await res.json();
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
      const res = await fetch(`/api/vinculos-compensacao/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error('Falha ao atualizar vínculo');
      return await res.json();
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
      const res = await fetch(`/api/vinculos-compensacao/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao remover vínculo');
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
