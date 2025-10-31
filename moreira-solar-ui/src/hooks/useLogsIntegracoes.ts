import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// BFF endpoints
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
      const res = await fetch('/api/integracoes/logs', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar logs');
      return (await res.json()) as LogIntegracao[];
    }
  });

  const addLog = useMutation({
    mutationFn: async (log: Omit<LogIntegracao, 'id' | 'user_id' | 'created_at'>) => {
      const res = await fetch('/api/integracoes/logs', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(log) });
      if (!res.ok) throw new Error('Falha ao registrar log');
      return await res.json();
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
      const res = await fetch(`/api/integracoes/logs/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao remover log');
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
