import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LogIntegracao {
  id: string;
  data: string;
  origem: string;
  status: 'Sucesso' | 'Erro';
  mensagem: string;
  payload?: any;
  user_id?: string;
  created_at?: string;
}

export function useLogsIntegracoes() {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs_integracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logs_integracoes')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;
      return data as LogIntegracao[];
    }
  });

  const addLog = useMutation({
    mutationFn: async (log: Omit<LogIntegracao, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('logs_integracoes')
        .insert([{ ...log, user_id: user?.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs_integracoes'] });
      toast.success('Log registrado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao registrar log: ' + error.message);
    }
  });

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('logs_integracoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs_integracoes'] });
      toast.success('Log removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover log: ' + error.message);
    }
  });

  return {
    logs,
    isLoading,
    addLog: addLog.mutate,
    deleteLog: deleteLog.mutate,
    isAdding: addLog.isPending,
    isDeleting: deleteLog.isPending
  };
}
