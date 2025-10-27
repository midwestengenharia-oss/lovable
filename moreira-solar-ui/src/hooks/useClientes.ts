import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Cliente } from '@/types/supabase';

export function useClientes() {
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('data_cadastro', { ascending: false });

      if (error) throw error;
      return data as Cliente[];
    }
  });

  const addCliente = useMutation({
    mutationFn: async (cliente: Omit<Cliente, 'id' | 'user_id' | 'dataCadastro'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('clientes')
        .insert([{ ...cliente, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente adicionado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar cliente: ' + error.message);
    }
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cliente> & { id: string }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar cliente: ' + error.message);
    }
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover cliente: ' + error.message);
    }
  });

  return {
    clientes,
    isLoading,
    addCliente: addCliente.mutate,
    updateCliente: updateCliente.mutate,
    deleteCliente: deleteCliente.mutate,
    isAdding: addCliente.isPending,
    isUpdating: updateCliente.isPending,
    isDeleting: deleteCliente.isPending
  };
}
