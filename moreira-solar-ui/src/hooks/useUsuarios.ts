import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Usuario {
  id: string;
  nome: string;
  email?: string | null;
  avatar?: string | null;
  perfil: 'admin' | 'gestor' | 'vendedor';
  gestor_id?: string | null;
  ativo?: boolean;
  data_cadastro?: string;
  ultimo_acesso?: string;
  created_at?: string;
  updated_at?: string;
}

export function useUsuarios() {
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Usuario[];
    }
  });

  const updateUsuario = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Usuario> & { id: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar usuário: ' + error.message);
    }
  });

  // Adicionar usuário através do Supabase Auth
  const addUsuario = useMutation({
    mutationFn: async (usuario: {
      email: string;
      password: string;
      nome: string;
      perfil: 'admin' | 'gestor' | 'vendedor'
    }) => {
      // TODO: Implementar criação de usuário via função do Supabase Edge Functions
      // Por enquanto, apenas mostra mensagem
      console.warn('Criação de usuário deve ser feita via Supabase Auth');
      toast.info('Use a página de cadastro para criar novos usuários');
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    }
  });

  const deleteUsuario = useMutation({
    mutationFn: async (id: string) => {
      // Apenas desativa o usuário (soft delete)
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário desativado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao desativar usuário: ' + error.message);
    }
  });

  return {
    usuarios,
    isLoading,
    addUsuario: addUsuario.mutate,
    updateUsuario: updateUsuario.mutate,
    deleteUsuario: deleteUsuario.mutate,
    isAdding: addUsuario.isPending,
    isUpdating: updateUsuario.isPending,
    isDeleting: deleteUsuario.isPending
  };
}
