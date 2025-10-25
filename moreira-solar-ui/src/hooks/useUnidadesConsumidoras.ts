import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase
        .from('unidades_consumidoras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapear campos snake_case para camelCase e adicionar defaults
      return (data || []).map(uc => ({
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('unidades_consumidoras')
        .insert([{
          numero_instalacao: unidade.numeroUC,
          titular_id: unidade.titularId,
          cliente_id: unidade.clienteId,
          projeto_id: unidade.projetoId,
          cidade: unidade.cidade,
          uf: unidade.uf,
          distribuidora: unidade.distribuidora,
          grupo: unidade.grupo,
          classe: unidade.classe,
          modalidade: unidade.modalidade,
          ativo: unidade.ativo,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
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

      const { data, error } = await supabase
        .from('unidades_consumidoras')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('unidades_consumidoras')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
