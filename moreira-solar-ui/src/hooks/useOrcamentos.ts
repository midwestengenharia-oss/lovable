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
      const userData = sessionStorage.getItem("usuario_logado");
      if (!userData) {
        console.warn("⚠️ Nenhum usuário logado encontrado no sessionStorage.");
        return [];
      }

      const user = JSON.parse(userData);
      console.log("👤 Usuário logado:", user);

      // Base query
      let query = supabase.from("orcamentos").select("*").order("data", { ascending: false });

      // Filtros de acordo com o perfil
      if (user.perfil === "admin") {
        console.log("👑 Admin logado — carregando todos os orçamentos.");
        // sem filtro
      }
      else if (user.perfil === "gestor") {
        console.log("🧭 Gestor logado — carregando orçamentos dos vendedores:", user.vendedores_ids);
        if (user.vendedores_ids && user.vendedores_ids.length > 0) {
          query = query.in("vendedor_id", user.vendedores_ids);
        } else {
          console.warn("⚠️ Gestor sem vendedores associados.");
          return [];
        }
      }
      else if (user.perfil === "vendedor") {
        console.log("🧑‍💼 Vendedor logado — carregando orçamentos dele mesmo:", user.id);
        query = query.eq("vendedor_id", user.id);
      }
      else {
        console.warn("⚠️ Perfil de usuário desconhecido:", user.perfil);
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log(`📦 ${data?.length || 0} orçamentos carregados do Supabase.`);
      return data as Orcamento[];
    }
  });

  // --- Mutations ---
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
