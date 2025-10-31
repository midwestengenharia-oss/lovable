// src/hooks/useProjetosKanban.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Projeto = {
    id: string;
    numero: string | null;
    nome: string | null;
    cliente_id: string | null;
    cliente_nome: string | null;
    data_conclusao_prevista: string | null;
    data_conclusao_real: string | null;
    progresso: number | null;
    status: string | null;
    valor_total: number | null;
    observacoes: string | null;
    responsavel_id: string | null;
    user_id: string | null;
    created_at: string;
    updated_at: string;
    kwp: number | null;
    prioridade: string | null;
    proximos_passos: string | null;
    kanban_column_id: string | null;
    entered_status_at: string | null;
};

export function useProjetos() {
    return useQuery({
        queryKey: ["projetos", "list"],
        queryFn: async (): Promise<Projeto[]> => {
            const res = await fetch('/api/projetos', { credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao carregar projetos');
            return (await res.json()) as any;
        }
    });
}

/** Atualizações de campos comuns (não-movimentação). */
export function useUpdateProjeto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Projeto> & { id: string }) => {
            const { id, ...rest } = payload;
            const res = await fetch(`/api/projetos/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(rest),
            });
            if (!res.ok) throw new Error('Falha ao atualizar projeto');
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["projetos", "list"] }),
    });
}

/** Movimentar entre colunas com validação de transição + histórico. */
export function useMoveProjeto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ projetoId, toColumnId }: { projetoId: string; toColumnId: string }) => {
            const res = await fetch(`/api/projetos/${projetoId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ kanban_column_id: toColumnId, entered_status_at: new Date().toISOString() })
            });
            if (!res.ok) throw new Error('Falha ao mover projeto');
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["projetos", "list"] }),
    });
}
