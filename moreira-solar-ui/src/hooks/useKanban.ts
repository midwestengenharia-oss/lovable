import { useQuery } from "@tanstack/react-query";

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
            const res = await fetch('/api/kanban/boards', { credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao carregar boards');
            const list = (await res.json()) as KanbanBoard[];
            return list.find(b => b.slug === slug) || null;
        },
    });
}

/** ✅ lista colunas ativas do board (ordenadas) */
export function useKanbanColumns(boardId?: string) {
    return useQuery({
        enabled: !!boardId,
        queryKey: ["kanban", "columns", boardId],
        queryFn: async (): Promise<KanbanColumn[]> => {
            const res = await fetch(`/api/kanban/columns?boardId=${boardId}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao carregar colunas');
            const cols = (await res.json()) as KanbanColumn[];
            return cols.filter(c => c.active !== false).sort((a,b)=>a.ord-b.ord);
        },
    });
}

/** (opcional) transições desse board */
export function useKanbanTransitions(boardId?: string) {
    return useQuery({
        enabled: !!boardId,
        queryKey: ["kanban", "transitions", boardId],
        queryFn: async (): Promise<KanbanTransition[]> => {
            const res = await fetch(`/api/kanban/transitions?boardId=${boardId}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao carregar transições');
            return (await res.json()) as KanbanTransition[];
        },
    });
}
