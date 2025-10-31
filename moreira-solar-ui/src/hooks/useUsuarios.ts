import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Usuario {
  id: string;
  nome: string;
  email?: string | null;
  avatar?: string | null;
  perfil: 'admin' | 'gestor' | 'vendedor';
  gestorId?: string | null;
  ativo?: boolean;
  dataCadastro?: string;
  ultimoAcesso?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useUsuarios() {
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const res = await fetch('/api/usuarios', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar usuários');
      return (await res.json()) as Usuario[];
    },
  });

  const updateUsuario = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Usuario> & { id: string }) => {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Falha ao atualizar usuário');
      return (await res.json()) as Usuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário atualizado com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro detalhado:', error);
      toast.error('Erro ao atualizar usuário: ' + error.message);
    },
  });

  const addUsuario = useMutation({
    mutationFn: async (_usuario: {
      email: string;
      password: string;
      nome: string;
      perfil: 'admin' | 'gestor' | 'vendedor';
    }) => {
      console.warn('Criação de usuário deve ser feita no backend/IdP');
      toast.info('Use a tela de cadastro do sistema.');
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });

  const deleteUsuario = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ativo: false }),
      });
      if (!res.ok) throw new Error('Falha ao desativar usuário');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário desativado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao desativar usuário: ' + error.message);
    },
  });

  return {
    usuarios,
    isLoading,
    addUsuario: addUsuario.mutate,
    updateUsuario: updateUsuario.mutate,
    deleteUsuario: deleteUsuario.mutate,
    isAdding: addUsuario.isPending,
    isUpdating: updateUsuario.isPending,
    isDeleting: deleteUsuario.isPending,
  };
}

