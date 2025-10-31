import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// BFF endpoints
import { toast } from 'sonner';

// Nota: A tabela do banco tem estrutura simplificada
// Campos no banco: numero_instalacao, titular_id, cliente_id, projeto_id, cidade, uf, distribuidora, grupo, classe, modalidade, ativo
// Campos esperados pelo componente: numeroUC, apelido, tipo, status, valorMedioFatura, etc.
// Esta é uma implementação básica que pode precisar de ajustes no schema do banco

export interface UnidadeConsumidora {
  id: string;
  numeroUC: string;
  apelido?: string;
  titularId: string;
  clienteId?: string;
  projetoId?: string;
  tipo: string;
  status: string;
  cidade?: string;
  uf?: string;
  distribuidora?: string;
  grupo?: string;
  classe?: string;
  modalidade?: string;
  valorMedioFatura: number;
  ativo: boolean;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useUnidadesConsumidoras() {
  const queryClient = useQueryClient();

  const { data: unidades = [], isLoading } = useQuery({
    queryKey: ['unidades_consumidoras'],
    queryFn: async () => {
      const res = await fetch('/api/unidades-consumidoras', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar unidades');
      const data = await res.json();
      return (data || []).map((uc: any) => ({
        id: uc.id,
        numeroUC: uc.numero_instalacao,
        apelido: uc.apelido || null,
        titularId: uc.titular_id,
        clienteId: uc.cliente_id,
        projetoId: uc.projeto_id,
        tipo: uc.tipo || 'convencional',
        status: uc.ativo ? 'ativa' : 'inativa',
        cidade: uc.cidade,
        uf: uc.uf,
        distribuidora: uc.distribuidora,
        grupo: uc.grupo,
        classe: uc.classe,
        modalidade: uc.modalidade,
        valorMedioFatura: 0, // TODO: Calcular da tabela faturas
        ativo: uc.ativo,
        user_id: uc.user_id,
        created_at: uc.created_at,
        updated_at: uc.updated_at
      })) as UnidadeConsumidora[];
    }
  });

  const addUnidade = useMutation({
    mutationFn: async (unidade: Omit<UnidadeConsumidora, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const res = await fetch('/api/unidades-consumidoras', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(unidade) });
      if (!res.ok) throw new Error('Falha ao cadastrar unidade');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades_consumidoras'] });
      toast.success('Unidade cadastrada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar unidade: ' + error.message);
    }
  });

  const updateUnidade = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UnidadeConsumidora> & { id: string }) => {
      const updateData: any = {};
      if (updates.numeroUC) updateData.numero_instalacao = updates.numeroUC;
      if (updates.titularId) updateData.titular_id = updates.titularId;
      if (updates.clienteId !== undefined) updateData.cliente_id = updates.clienteId;
      if (updates.projetoId !== undefined) updateData.projeto_id = updates.projetoId;
      if (updates.cidade !== undefined) updateData.cidade = updates.cidade;
      if (updates.uf !== undefined) updateData.uf = updates.uf;
      if (updates.distribuidora !== undefined) updateData.distribuidora = updates.distribuidora;
      if (updates.grupo !== undefined) updateData.grupo = updates.grupo;
      if (updates.classe !== undefined) updateData.classe = updates.classe;
      if (updates.modalidade !== undefined) updateData.modalidade = updates.modalidade;
      if (updates.ativo !== undefined) updateData.ativo = updates.ativo;
      const res = await fetch(`/api/unidades-consumidoras/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(updateData) });
      if (!res.ok) throw new Error('Falha ao atualizar unidade');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades_consumidoras'] });
      toast.success('Unidade atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar unidade: ' + error.message);
    }
  });

  const deleteUnidade = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/unidades-consumidoras/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao remover unidade');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades_consumidoras'] });
      toast.success('Unidade removida com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover unidade: ' + error.message);
    }
  });

  return {
    unidades,
    isLoading,
    addUnidade: addUnidade.mutate,
    updateUnidade: updateUnidade.mutate,
    deleteUnidade: deleteUnidade.mutate,
    isAdding: addUnidade.isPending,
    isUpdating: updateUnidade.isPending,
    isDeleting: deleteUnidade.isPending
  };
}
