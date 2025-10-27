import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type KanbanBoard = { id: string; slug: string; name: string; entity: string; active: boolean };
export type KanbanColumn = {
    id: string; board_id: string; key: string; title: string; ord: number;
    terminal: boolean; active: boolean; wip_limit: number | null; sla_days: number | null;
    color_header: string | null; color_badge: string | null;
};
export type KanbanTransition = { id: string; board_id: string; from_column_id: string; to_column_id: string };

/** ✅ pega 1 board pelo slug (ex.: "obra") */
export function useKanbanBoardBySlug(slug: string) {
    return useQuery({
        queryKey: ["kanban", "board", slug],
        queryFn: async (): Promise<KanbanBoard | null> => {
            const { data, error } = await supabase
                .from("kanban_board")
                .select("*")
                .eq("slug", slug)
                .maybeSingle();
            if (error) throw error;
            return data as KanbanBoard | null;
        },
    });
}

/** ✅ lista colunas ativas do board (ordenadas) */
export function useKanbanColumns(boardId?: string) {
    return useQuery({
        enabled: !!boardId,
        queryKey: ["kanban", "columns", boardId],
        queryFn: async (): Promise<KanbanColumn[]> => {
            const { data, error } = await supabase
                .from("kanban_column")
                .select("*")
                .eq("board_id", boardId!)
                .eq("active", true)
                .order("ord");
            if (error) throw error;
            return data as KanbanColumn[];
        },
    });
}

/** (opcional) transições desse board */
export function useKanbanTransitions(boardId?: string) {
    return useQuery({
        enabled: !!boardId,
        queryKey: ["kanban", "transitions", boardId],
        queryFn: async (): Promise<KanbanTransition[]> => {
            const { data, error } = await supabase
                .from("kanban_transition")
                .select("*")
                .eq("board_id", boardId!);
            if (error) throw error;
            return data as KanbanTransition[];
        },
    });
}
