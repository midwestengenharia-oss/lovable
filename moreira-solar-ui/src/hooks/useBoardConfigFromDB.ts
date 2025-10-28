// hooks/useBoardConfigFromDB.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DBBoard = { id: string; slug: string; name: string; entity: string; active: boolean };
export type DBColumn = {
    id: string; board_id: string; key: string; title: string; ord: number;
    terminal: boolean; active: boolean; wip_limit: number | null; sla_days: number | null;
    color_header: string | null; color_badge: string | null; update_patch: any | null;
};
export type DBTransition = { id: string; board_id: string; from_column_id: string; to_column_id: string };

export type LoadedBoard = {
    board: DBBoard;
    columns: DBColumn[];
    transitions: Record<string, string[]>; // fromColId -> [toColId]
};

export function useBoardConfigFromDB(boardSlugOrId: string) {
    return useQuery({
        queryKey: ["kanban", "loaded", boardSlugOrId],
        queryFn: async (): Promise<LoadedBoard> => {
            // aceita slug ou id
            const { data: board } = await supabase
                .from("kanban_board")
                .select("*")
                .or(`id.eq.${boardSlugOrId},slug.eq.${boardSlugOrId}`)
                .maybeSingle();
            if (!board) throw new Error("Board não encontrado");

            const { data: cols, error: eCols } = await supabase
                .from("kanban_column")
                .select("*")
                .eq("board_id", board.id)
                .eq("active", true)
                .order("ord");
            if (eCols) throw eCols;

            const { data: trans, error: eTrans } = await supabase
                .from("kanban_transition")
                .select("*")
                .eq("board_id", board.id);
            if (eTrans) throw eTrans;

            const transitions: Record<string, string[]> = {};
            (trans || []).forEach((t: DBTransition) => {
                transitions[t.from_column_id] ||= [];
                transitions[t.from_column_id].push(t.to_column_id);
            });

            return { board, columns: cols || [], transitions };
        },
    });
}
