import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// BFF endpoints
import { toast } from 'sonner';

export interface Equipamento {
  id: string;
  tipo: 'modulo' | 'inversor';
  nome: string;
  potenciaW?: number;
  valor: number;
  ativo: boolean;
}

export type EquipamentoInput = Omit<Equipamento, 'id'>;

export function useEquipamentos() {
  const queryClient = useQueryClient();

  const { data: equipamentos = [], isLoading } = useQuery({
    queryKey: ['equipamentos'],
    queryFn: async () => {
      const res = await fetch('/api/equipamentos', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar equipamentos');
      const data = await res.json();
      return (data || []).map((item: any) => ({
        id: item.id,
        tipo: item.tipo as 'modulo' | 'inversor',
        nome: item.nome,
        potenciaW: item.potencia_w,
        valor: item.valor,
        ativo: item.ativo
      })) as Equipamento[];
    }
  });

  // Mutation para adicionar equipamento
  const addEquipamento = useMutation({
    mutationFn: async (equipamento: EquipamentoInput) => {
      const res = await fetch('/api/equipamentos', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(equipamento) });
      if (!res.ok) throw new Error('Falha ao adicionar equipamento');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast.success('Equipamento adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao adicionar equipamento:', error);
      toast.error('Erro ao adicionar equipamento');
    }
  });

  // Mutation para atualizar equipamento
  const updateEquipamento = useMutation({
    mutationFn: async ({ id, ...equipamento }: Equipamento) => {
      const res = await fetch(`/api/equipamentos/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(equipamento) });
      if (!res.ok) throw new Error('Falha ao atualizar equipamento');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast.success('Equipamento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar equipamento:', error);
      toast.error('Erro ao atualizar equipamento');
    }
  });

  // Mutation para deletar equipamento
  const deleteEquipamento = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/equipamentos/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao excluir equipamento');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast.success('Equipamento excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir equipamento:', error);
      toast.error('Erro ao excluir equipamento');
    }
  });

  const modulos = equipamentos.filter(e => e.tipo === 'modulo');
  const inversores = equipamentos.filter(e => e.tipo === 'inversor');

  return {
    equipamentos,
    modulos,
    inversores,
    isLoading,
    addEquipamento: addEquipamento.mutate,
    updateEquipamento: updateEquipamento.mutate,
    deleteEquipamento: deleteEquipamento.mutate,
    isAdding: addEquipamento.isPending,
    isUpdating: updateEquipamento.isPending,
    isDeleting: deleteEquipamento.isPending
  };
}
