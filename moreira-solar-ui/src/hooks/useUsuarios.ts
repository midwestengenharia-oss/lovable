import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export interface Usuario {
  id: string;
  nome: string;
  email?: string | null;
  avatar?: string | null;
  perfil: 'admin' | 'gestor' | 'vendedor';
  gestorId?: string | null; // 👈 Mantém camelCase para o frontend
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 🔄 Mapeia snake_case do DB para camelCase do frontend
      return (data || []).map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        avatar: u.avatar,
        perfil: u.perfil,
        gestorId: u.gestor_id,
        ativo: u.ativo ?? true,
        dataCadastro: u.data_cadastro,
        ultimoAcesso: u.ultimo_acesso,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      })) as Usuario[];
    }
  });

  const updateUsuario = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Usuario> & { id: string }) => {
      // 🔄 Converte camelCase para snake_case e limpa valores inválidos
      const dbUpdates: any = {};

      if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.perfil !== undefined) dbUpdates.perfil = updates.perfil;
      if (updates.ativo !== undefined) dbUpdates.ativo = updates.ativo;

      // ✅ Trata gestorId especialmente (converte "" para null)
      if (updates.gestorId !== undefined) {
        dbUpdates.gestor_id = updates.gestorId === "" || updates.gestorId === null
          ? null
          : updates.gestorId;
      }

      if (updates.ultimoAcesso !== undefined) dbUpdates.ultimo_acesso = updates.ultimoAcesso;

      console.log('📤 Enviando para DB:', dbUpdates);

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 🔄 Retorna em camelCase
      return {
        id: data.id,
        nome: data.nome,
        email: data.email,
        avatar: data.avatar,
        perfil: data.perfil,
        gestorId: data.gestor_id,
        ativo: data.ativo,
        dataCadastro: data.data_cadastro,
        ultimoAcesso: data.ultimo_acesso,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Usuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário atualizado com sucesso');
    },
    onError: (error: any) => {
      console.error('❌ Erro detalhado:', error);
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