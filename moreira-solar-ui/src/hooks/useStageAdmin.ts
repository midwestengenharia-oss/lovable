// src/hooks/useStageAdmin.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Board = { id: string; name: string; slug: string; entity: string; active: boolean };
export type Column = { id: string; board_id: string; title: string; key: string; ord: number; active: boolean };
export type Field = {
    id?: string;
    board_id: string;
    column_id: string;
    ord: number;
    key: string;
    label: string;
    type: "text" | "textarea" | "number" | "date" | "select" | "radio" | "checkbox" | "boolean" | "file";
    required: boolean;
    options: any[];
    helper?: string | null;
    active: boolean;
};

export const useBoards = () =>
    useQuery({
        queryKey: ["kanban", "boards"],
        queryFn: async (): Promise<Board[]> => {
            const { data, error } = await supabase.from("kanban_board").select("*").order("name");
            if (error) throw error;
            return data as any;
        },
    });

export const useColumnsByBoard = (boardId?: string) =>
    useQuery({
        enabled: !!boardId,
        queryKey: ["kanban", "columns", boardId],
        queryFn: async (): Promise<Column[]> => {
            const { data, error } = await supabase
                .from("kanban_column")
                .select("*")
                .eq("board_id", boardId!)
                .eq("active", true)
                .order("ord");
            if (error) throw error;
            return data as any;
        },
    });

export const useFieldsByColumn = (columnId?: string) =>
    useQuery({
        enabled: !!columnId,
        queryKey: ["stage", "fields", columnId],
        queryFn: async (): Promise<Field[]> => {
            const { data, error } = await supabase
                .from("stage_field")
                .select("*")
                .eq("column_id", columnId!)
                .eq("active", true)
                .order("ord");
            if (error) throw error;
            return data as any;
        },
    });

export function useUpsertField(boardId: string, columnId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (f: Partial<Field>) => {
            if (!f.label || !f.key || !f.type) throw new Error("Preencha label, key e tipo.");
            if (f.id) {
                const { id, ...rest } = f as any;
                const { data, error } = await supabase
                    .from("stage_field")
                    .update(rest)
                    .eq("id", id)
                    .select()
                    .single();
                if (error) throw error;
                return data as Field;
            } else {
                // pega último ord
                const { data: last, error: eMax } = await supabase
                    .from("stage_field")
                    .select("ord")
                    .eq("column_id", columnId)
                    .order("ord", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (eMax) throw eMax;
                const body: Field = {
                    id: crypto.randomUUID(),
                    board_id: boardId,
                    column_id: columnId,
                    ord: (last?.ord ?? 0) + 1,
                    key: f.key!,
                    label: f.label!,
                    type: f.type as Field["type"],
                    required: !!f.required,
                    options: Array.isArray(f.options) ? f.options : [],
                    helper: f.helper ?? null,
                    active: true,
                };
                const { data, error } = await supabase
                    .from("stage_field")
                    .insert(body)
                    .select()
                    .single();
                if (error) throw error;
                return data as Field;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["stage", "fields", columnId] });
        },
    });
}

export function useDeleteField(columnId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("stage_field").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["stage", "fields", columnId] });
        },
    });
}

export function useSaveFieldsOrder(columnId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (fields: Field[]) => {
            for (let i = 0; i < fields.length; i++) {
                const f = fields[i];
                const { error } = await supabase
                    .from("stage_field")
                    .update({ ord: i + 1 })
                    .eq("id", f.id!);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["stage", "fields", columnId] });
        },
    });
}
