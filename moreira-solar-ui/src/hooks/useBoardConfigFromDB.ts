// hooks/useBoardConfigFromDB.ts (BFF version)
import { useQuery } from "@tanstack/react-query";

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
      // boards
      const resBoards = await fetch('/api/kanban/boards', { credentials: 'include' });
      if (!resBoards.ok) throw new Error('Falha ao carregar boards');
      const boards = (await resBoards.json()) as DBBoard[];
      const board = boards.find(b => b.id === boardSlugOrId || b.slug === boardSlugOrId);
      if (!board) throw new Error('Board não encontrado');

      // columns
      const resCols = await fetch(`/api/kanban/columns?boardId=${board.id}`, { credentials: 'include' });
      if (!resCols.ok) throw new Error('Falha ao carregar colunas');
      const colsAll = (await resCols.json()) as DBColumn[];
      const columns = colsAll.filter(c => c.active !== false).sort((a,b)=>a.ord-b.ord);

      // transitions
      const resTrans = await fetch(`/api/kanban/transitions?boardId=${board.id}`, { credentials: 'include' });
      if (!resTrans.ok) throw new Error('Falha ao carregar transições');
      const trs = (await resTrans.json()) as DBTransition[];
      const transitions: Record<string, string[]> = {};
      (trs || []).forEach((t) => {
        transitions[t.from_column_id] ||= [];
        transitions[t.from_column_id].push(t.to_column_id);
      });

      return { board, columns, transitions };
    },
  });
}

