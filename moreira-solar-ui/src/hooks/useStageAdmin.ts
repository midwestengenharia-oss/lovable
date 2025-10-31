import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Board = { id: string; name: string; slug: string };
export type Column = { id: string; board_id: string; title: string; key: string; ord: number };
export type Field = {
  id?: string;
  board_id: string;
  column_id: string;
  ord: number;
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "radio" | "checkbox" | "boolean" | "file";
  required: boolean;
  options: any[] | null;
  helper?: string | null;
  active: boolean;
};

export function useBoards() {
  return useQuery({
    queryKey: ["boards"],
    queryFn: async (): Promise<Board[]> => {
      const res = await fetch('/api/kanban/boards', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar boards');
      return (await res.json()) as Board[];
    },
  });
}

export function useColumnsByBoard(boardId?: string) {
  return useQuery({
    enabled: !!boardId,
    queryKey: ["columns", boardId],
    queryFn: async (): Promise<Column[]> => {
      const res = await fetch(`/api/kanban/columns?boardId=${boardId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar colunas');
      return (await res.json()) as Column[];
    },
  });
}

export function useFieldsByColumn(columnId?: string) {
  return useQuery({
    enabled: !!columnId,
    queryKey: ["stage", "fields", columnId],
    queryFn: async (): Promise<Field[]> => {
      const res = await fetch(`/api/kanban/fields?columnId=${columnId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar campos');
      return (await res.json()) as Field[];
    },
  });
}

export function useUpsertField(boardId: string, columnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Field>) => {
      const body: any = { ...payload };
      if (!body.key || !String(body.key).trim()) throw new Error('Key não pode ser vazio.');
      if (!body.board_id) body.board_id = boardId;
      if (!body.column_id) body.column_id = columnId;
      const res = await fetch('/api/kanban/fields', {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Falha ao salvar campo');
      return await res.json();
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["stage", "fields", columnId] }); },
  });
}

export function useSaveFieldsOrder(columnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (list: Field[]) => {
      const ids = list.filter(f => !!f.id).map(f => f.id!)
      const res = await fetch('/api/kanban/fields/order', {
        method: 'PATCH', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ columnId, ids })
      });
      if (!res.ok) throw new Error('Falha ao salvar ordenação');
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["stage", "fields", columnId] }); },
  });
}

export function useDeleteField(columnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fieldId: string) => {
      const res = await fetch(`/api/kanban/fields/${fieldId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao remover campo');
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["stage", "fields", columnId] }); },
  });
}

