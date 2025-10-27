// src/hooks/useProjetosKanban.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
            const { data, error } = await supabase
                .from("projetos")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as any;
        }
    });
}

/** Atualizações de campos comuns (não-movimentação). */
export function useUpdateProjeto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Projeto> & { id: string }) => {
            const { id, ...rest } = payload;
            const { error } = await supabase.from("projetos").update(rest).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["projetos", "list"] }),
    });
}

/** Movimentar entre colunas com validação de transição + histórico. */
export function useMoveProjeto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ projetoId, toColumnId }: { projetoId: string; toColumnId: string }) => {
            const { error } = await supabase.rpc("fn_move_projeto", {
                p_projeto_id: projetoId,
                p_to_column_id: toColumnId,
            });
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["projetos", "list"] }),
    });
}
