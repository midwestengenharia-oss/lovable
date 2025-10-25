import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TitularEnergia {
  id: string;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  observacoes?: string;
  user_id: string;
  dataCadastro?: string;
  created_at?: string;
  updated_at?: string;
}

export function useTitularesEnergia() {
  const queryClient = useQueryClient();

  const { data: titulares = [], isLoading } = useQuery({
    queryKey: ['titulares_energia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('titulares_energia')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapear campos snake_case para camelCase
      return (data || []).map(titular => ({
        ...titular,
        cpfCnpj: titular.cpf_cnpj,
        dataCadastro: titular.created_at
      })) as TitularEnergia[];
    }
  });

  const addTitular = useMutation({
    mutationFn: async (titular: Omit<TitularEnergia, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'dataCadastro'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('titulares_energia')
        .insert([{
          nome: titular.nome,
          cpf_cnpj: titular.cpfCnpj,
          email: titular.email,
          telefone: titular.telefone,
          observacoes: titular.observacoes,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titulares_energia'] });
      toast.success('Titular cadastrado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar titular: ' + error.message);
    }
  });

  const updateTitular = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TitularEnergia> & { id: string }) => {
      const updateData: any = {};
      if (updates.nome) updateData.nome = updates.nome;
      if (updates.cpfCnpj) updateData.cpf_cnpj = updates.cpfCnpj;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.telefone !== undefined) updateData.telefone = updates.telefone;
      if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

      const { data, error } = await supabase
        .from('titulares_energia')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titulares_energia'] });
      toast.success('Titular atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar titular: ' + error.message);
    }
  });

  const deleteTitular = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('titulares_energia')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titulares_energia'] });
      toast.success('Titular removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover titular: ' + error.message);
    }
  });

  return {
    titulares,
    isLoading,
    addTitular: addTitular.mutate,
    updateTitular: updateTitular.mutate,
    deleteTitular: deleteTitular.mutate,
    isAdding: addTitular.isPending,
    isUpdating: updateTitular.isPending,
    isDeleting: deleteTitular.isPending
  };
}
