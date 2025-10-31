import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Chamado {
  id: string;
  numero: string;
  cliente: string;
  projeto_id?: string;
  tipo: 'Manutenção' | 'Garantia' | 'Suporte' | 'Limpeza' | string;
  prioridade: 'Baixa' | 'Média' | 'Alta' | string;
  status: 'Onboarding' | 'Ativo' | 'Manutenção' | 'Chamado' | 'Finalizado' | string;
  descricao: string;
  data: string;
  tecnico?: string;
  avatar?: string;
  historico?: any[];
  fotos?: any[];
  resolucao?: string;
  data_finalizacao?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

function ensureObject<T extends object = Record<string, any>>(v: any): T {
  if (Array.isArray(v)) return (v[0] ?? {}) as T;
  if (typeof v === 'string') { try { return JSON.parse(v) as T; } catch { return {} as T; } }
  return (v ?? {}) as T;
}

export function useChamados() {
  const queryClient = useQueryClient();

  const { data: chamados = [], isLoading } = useQuery({
    queryKey: ['chamados'],
    queryFn: async () => {
      const res = await fetch('/api/chamados', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar chamados');
      return (await res.json()) as Chamado[];
    }
  });

  const addChamadoMutation = useMutation({
    mutationFn: async (chamado: Omit<Chamado, 'id' | 'user_id' | 'numero'> & { numero?: string }) => {
      const res = await fetch('/api/chamados', {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(chamado)
      });
      if (!res.ok) throw new Error('Falha ao criar chamado');
      return await res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chamados'] }); toast.success('Chamado criado com sucesso'); },
    onError: (e: any) => toast.error('Erro ao criar chamado: ' + e.message)
  });

  const updateChamadoMutation = useMutation({
    mutationFn: async (payload: Partial<Chamado> & { id: string }) => {
      const { id, ...rest } = payload; const safe = ensureObject(rest);
      const res = await fetch(`/api/chamados/${id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(safe)
      });
      if (!res.ok) throw new Error('Falha ao atualizar chamado');
      return await res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chamados'] }); toast.success('Chamado atualizado com sucesso'); },
    onError: (e: any) => toast.error('Erro ao atualizar chamado: ' + e.message)
  });

  const deleteChamadoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/chamados/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao remover chamado');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chamados'] }); toast.success('Chamado removido com sucesso'); },
    onError: (e: any) => toast.error('Erro ao remover chamado: ' + e.message)
  });

  return {
    chamados,
    isLoading,
    addChamado: addChamadoMutation.mutate,
    updateChamado: (id: string, patch: Partial<Chamado> | string | any[]) => updateChamadoMutation.mutate({ id, ...ensureObject(patch) }),
    deleteChamado: deleteChamadoMutation.mutate,
    isAdding: addChamadoMutation.isPending,
    isUpdating: updateChamadoMutation.isPending,
    isDeleting: deleteChamadoMutation.isPending,
  };
}

