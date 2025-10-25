import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Lead } from '@/types/supabase';

export function useLeads() {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    }
  });

  const addLead = useMutation({
    mutationFn: async (lead: Omit<Lead, 'id' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...lead, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead adicionado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar lead: ' + error.message);
    }
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar lead: ' + error.message);
    }
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover lead: ' + error.message);
    }
  });

  return {
    leads,
    isLoading,
    addLead: addLead.mutate,
    updateLead: updateLead.mutate,
    deleteLead: deleteLead.mutate,
    isAdding: addLead.isPending,
    isUpdating: updateLead.isPending,
    isDeleting: deleteLead.isPending
  };
}
