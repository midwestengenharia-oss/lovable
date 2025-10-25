import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .order('tipo', { ascending: true });

      if (error) throw error;

      // Mapear snake_case para camelCase
      return (data || []).map(item => ({
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
      const { data, error } = await supabase
        .from('equipamentos')
        .insert({
          tipo: equipamento.tipo,
          nome: equipamento.nome,
          potencia_w: equipamento.potenciaW,
          valor: equipamento.valor,
          ativo: equipamento.ativo
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('equipamentos')
        .update({
          tipo: equipamento.tipo,
          nome: equipamento.nome,
          potencia_w: equipamento.potenciaW,
          valor: equipamento.valor,
          ativo: equipamento.ativo
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
