import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// BFF endpoints
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
      const res = await fetch('/api/titulares-energia', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar titulares');
      const data = await res.json();
      return (data || []).map((titular: any) => ({
        ...titular,
        cpfCnpj: titular.cpf_cnpj,
        dataCadastro: titular.created_at
      })) as TitularEnergia[];
    }
  });

  const addTitular = useMutation({
    mutationFn: async (titular: Omit<TitularEnergia, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'dataCadastro'>) => {
      const res = await fetch('/api/titulares-energia', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...titular, cpf_cnpj: titular.cpfCnpj }) });
      if (!res.ok) throw new Error('Falha ao cadastrar titular');
      return await res.json();
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
      const res = await fetch(`/api/titulares-energia/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(updateData) });
      if (!res.ok) throw new Error('Falha ao atualizar titular');
      return await res.json();
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
      const res = await fetch(`/api/titulares-energia/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao remover titular');
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
