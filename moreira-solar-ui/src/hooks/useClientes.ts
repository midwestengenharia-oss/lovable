import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Cliente } from '@/types/supabase';

export function useClientes() {
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await fetch('/api/clientes', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar clientes');
      return (await res.json()) as Cliente[];
    }
  });

  const addCliente = useMutation({
    mutationFn: async (cliente: any) => {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(cliente),
      });
      if (!res.ok) throw new Error('Falha ao adicionar cliente');
      return await res.json();
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
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Falha ao atualizar cliente');
      return await res.json();
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
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao remover cliente');
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
