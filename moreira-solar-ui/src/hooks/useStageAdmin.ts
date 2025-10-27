import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Tipos base */
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

// Sua stage_value não tem id; PK composta (project_id + field_id)
type StageValueRow = {
    project_id: string;
    field_id: string;
    value: any; // json / texto / número, depende do campo
};

const BUCKET = "kanban_uploads";

/* =========================
   Helpers para Storage keys
========================= */

function extractKeyFromUrl(url: string, bucket = BUCKET): string | null {
    try {
        const u = new URL(url);
        // Formatos comuns do Supabase:
        // /storage/v1/object/public/<bucket>/<key>
        // /storage/v1/object/sign/<bucket>/<key>?token=...
        const p = u.pathname;
        const m1 = `/object/public/${bucket}/`;
        const m2 = `/object/sign/${bucket}/`;
        if (p.includes(m1)) return p.split(m1)[1] || null;
        if (p.includes(m2)) return (p.split(m2)[1] || "").split("?")[0] || null;

        // fallback: se vier /<bucket>/<key>
        const m3 = `/${bucket}/`;
        if (p.includes(m3)) return p.split(m3)[1] || null;

        return null;
    } catch {
        return null;
    }
}

function collectStorageKeysFromValue(v: any, bucket = BUCKET): string[] {
    // Aceita:
    // - string (já é a key ou uma URL pública)
    // - objeto { path, url, ... }
    // - array mix desses formatos
    const keys: string[] = [];

    const pushMaybe = (candidate: any) => {
        if (!candidate) return;
        if (typeof candidate === "string") {
            // Pode ser a key direta ou uma URL
            const byUrl = extractKeyFromUrl(candidate, bucket);
            keys.push((byUrl || candidate).trim());
            return;
        }
        if (typeof candidate === "object") {
            const path = typeof candidate.path === "string" ? candidate.path.trim() : null;
            const url = typeof candidate.url === "string" ? candidate.url.trim() : null;
            if (path && path.length > 0) {
                keys.push(path);
                return;
            }
            if (url && url.length > 0) {
                const k = extractKeyFromUrl(url, bucket);
                if (k) keys.push(k);
            }
        }
    };

    if (Array.isArray(v)) {
        v.forEach(pushMaybe);
    } else {
        pushMaybe(v);
    }

    // filtra vazios, nulos e duplica
    return Array.from(new Set(keys.filter((k) => typeof k === "string" && k.length > 0)));
}

/* =========================
   Queries
========================= */

export function useBoards() {
    return useQuery({
        queryKey: ["boards"],
        queryFn: async (): Promise<Board[]> => {
            const { data, error } = await supabase.from("kanban_board").select("*").order("name");
            if (error) throw error;
            return data as Board[];
        },
    });
}

export function useColumnsByBoard(boardId?: string) {
    return useQuery({
        enabled: !!boardId,
        queryKey: ["columns", boardId],
        queryFn: async (): Promise<Column[]> => {
            const { data, error } = await supabase
                .from("kanban_column")
                .select("*")
                .eq("board_id", boardId!)
                .order("ord");
            if (error) throw error;
            return data as Column[];
        },
    });
}

export function useFieldsByColumn(columnId?: string) {
    return useQuery({
        enabled: !!columnId,
        queryKey: ["stage", "fields", columnId],
        queryFn: async (): Promise<Field[]> => {
            const { data, error } = await supabase
                .from("stage_field")
                .select("*")
                .eq("column_id", columnId!)
                .order("ord");
            if (error) throw error;
            return (data || []) as Field[];
        },
    });
}

/* =========================
   Mutations
========================= */

export function useUpsertField(boardId: string, columnId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Field>) => {
            const body: any = { ...payload };

            // Se for criação, calcular ORD automaticamente
            if (!payload.id) {
                const { data: last } = await supabase
                    .from("stage_field")
                    .select("ord")
                    .eq("column_id", columnId)
                    .order("ord", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                body.ord = (last?.ord ?? 0) + 1;
                body.board_id = boardId;
                body.column_id = columnId;
                body.active = body.active ?? true;
            }

            if (!body.key || !String(body.key).trim()) {
                throw new Error("Key não pode ser vazio.");
            }

            const { error } = await supabase.from("stage_field").upsert(body).select().single();
            if (error) throw error;
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["stage", "fields", columnId] });
        },
    });
}

export function useSaveFieldsOrder(columnId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (list: Field[]) => {
            for (let i = 0; i < list.length; i++) {
                const f = list[i];
                if (!f.id) continue;
                const { error } = await supabase.from("stage_field").update({ ord: i + 1 }).eq("id", f.id);
                if (error) throw error;
            }
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["stage", "fields", columnId] });
        },
    });
}

/**
 * DELETE de campo com limpeza SEGURA:
 * - Deleta valores em stage_value
 * - Se o campo for FILE, remove objetos do Storage usando chaves válidas
 *   (resolve o erro "argument 1: key must not be null").
 */
export function useDeleteField(columnId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (fieldId: string) => {
            if (!fieldId) throw new Error("fieldId inválido");

            // Buscar o campo para saber o tipo
            const { data: field, error: fErr } = await supabase
                .from("stage_field")
                .select("*")
                .eq("id", fieldId)
                .single();
            if (fErr) throw fErr;

            // Buscar valores relacionados
            const { data: values, error: vErr } = await supabase
                .from("stage_value")
                .select("project_id,field_id,value")
                .eq("field_id", fieldId);
            if (vErr) throw vErr;

            // Se for arquivo, coletar keys com robustez
            if (field?.type === "file" && Array.isArray(values) && values.length > 0) {
                const keys = new Set<string>();
                for (const row of values as StageValueRow[]) {
                    collectStorageKeysFromValue(row.value, BUCKET).forEach((k) => keys.add(k));
                }
                const list = Array.from(keys).filter((k) => typeof k === "string" && k.length > 0);
                if (list.length > 0) {
                    const { error: remErr } = await supabase.storage.from(BUCKET).remove(list);
                    if (remErr) {
                        // Não interrompe o fluxo de deleção do campo
                        console.warn("[storage.remove] falhou:", remErr.message);
                    }
                }
            }

            // Remover valores
            const { error: dValErr } = await supabase.from("stage_value").delete().eq("field_id", fieldId);
            if (dValErr) throw dValErr;

            // Remover o campo
            const { error: dFieldErr } = await supabase.from("stage_field").delete().eq("id", fieldId);
            if (dFieldErr) throw dFieldErr;
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["stage", "fields", columnId] });
        },
    });
}
