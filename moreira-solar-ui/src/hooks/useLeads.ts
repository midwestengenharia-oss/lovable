import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lead } from '@/types/supabase';

export function useLeads() {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await fetch('/api/leads', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar leads');
      return (await res.json()) as Lead[];
    },
  });

  const addLead = useMutation({
    mutationFn: async (lead: Omit<Lead, 'id' | 'user_id'>) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(lead),
      });
      if (!res.ok) throw new Error('Erro ao adicionar lead');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead adicionado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar lead: ' + error.message);
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Erro ao atualizar lead');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar lead: ' + error.message);
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao remover lead');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover lead: ' + error.message);
    },
  });

  return {
    leads,
    isLoading,
    addLead: addLead.mutate,
    updateLead: updateLead.mutate,
    deleteLead: deleteLead.mutate,
    isAdding: addLead.isPending,
    isUpdating: updateLead.isPending,
    isDeleting: deleteLead.isPending,
  };
}

