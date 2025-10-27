import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Orcamento } from '@/types/supabase';

export function useOrcamentos() {
  const queryClient = useQueryClient();

  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      // 🔐 Recupera o usuário logado do sessionStorage
      let userData = sessionStorage.getItem("usuario_logado");

      // 🧠 Caso ainda não tenha sido salvo (login recente ou refresh), tenta restaurar do Supabase
      if (!userData) {
        const { data } = await supabase.auth.getSession();
        const sessao = data?.session;
        if (sessao?.user) {
          const user = sessao.user;
          const meta = user.user_metadata || {};
          const usuario_logado = {
            id: user.id,
            nome: meta.nome || "Usuário",
            tipo: meta.perfil || "vendedor",
            email: user.email,
          };
          sessionStorage.setItem("usuario_logado", JSON.stringify(usuario_logado));
          userData = JSON.stringify(usuario_logado);
        } else {
          console.warn("⚠️ Nenhum usuário logado encontrado (nem sessionStorage nem Supabase).");
          return [];
        }
      }

      const user = JSON.parse(userData);

      // --- Base Query ---
      let query = supabase
        .from("orcamentos")
        .select("*")
        .order("data", { ascending: false });

      // --- Filtros por perfil ---
      const perfil = user.tipo || user.perfil; // compatibilidade entre chaves antigas e novas

      if (perfil === "admin") {
        // sem filtro
      }
      else if (perfil === "gestor") {
        if (user.vendedores_ids?.length > 0) {
          query = query.in("vendedor_id", user.vendedores_ids);
        } else {
          console.warn("⚠️ Gestor sem vendedores associados.");
          return [];
        }
      }
      else if (perfil === "vendedor") {
        query = query.eq("vendedor_id", user.id);
      }
      else {
        console.warn("⚠️ Perfil de usuário desconhecido:", perfil);
        return [];
      }

      // --- Execução da query ---
      const { data, error } = await query;
      if (error) {
        console.error("❌ Erro ao buscar orçamentos:", error.message);
        throw error;
      }

      return data as Orcamento[];
    }
  });

  // --- MUTATIONS ---
  const addOrcamento = useMutation({
    mutationFn: async (orcamento: Omit<Orcamento, 'id' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('orcamentos')
        .insert([{ ...orcamento, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento criado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar orçamento: ' + error.message);
    }
  });

  const updateOrcamento = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Orcamento> & { id: string }) => {
      const { data, error } = await supabase
        .from('orcamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar orçamento: ' + error.message);
    }
  });

  const deleteOrcamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover orçamento: ' + error.message);
    }
  });

  return {
    orcamentos,
    isLoading,
    addOrcamento: addOrcamento.mutate,
    updateOrcamento: updateOrcamento.mutate,
    deleteOrcamento: deleteOrcamento.mutate,
    isAdding: addOrcamento.isPending,
    isUpdating: updateOrcamento.isPending,
    isDeleting: deleteOrcamento.isPending
  };
}
