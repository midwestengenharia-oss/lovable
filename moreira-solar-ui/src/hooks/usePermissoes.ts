import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Permissao = {
    modulo: string;
    visualizar: boolean;
    criar: boolean;
    editar: boolean;
    excluir: boolean;
};

export function usePermissoes(userId?: string) {
    const qc = useQueryClient();

    const permissoesQuery = useQuery({
        queryKey: ["permissoes", userId],
        enabled: !!userId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("permissoes")
                .select("modulo, visualizar, criar, editar, excluir")
                .eq("user_id", userId!);
            if (error) throw error;
            // retorna como dicionário por modulo (opcional)
            return (data || []) as Permissao[];
        },
    });

    const upsertPermissoes = useMutation({
        mutationFn: async (payload: { userId: string; permissoes: Permissao[] }) => {
            // upsert em massa
            const rows = payload.permissoes.map(p => ({
                user_id: payload.userId,
                modulo: p.modulo,
                visualizar: p.visualizar,
                criar: p.criar,
                editar: p.editar,
                excluir: p.excluir,
                updated_at: new Date().toISOString(),
            }));
            const { error } = await supabase.from("permissoes").upsert(rows, {
                onConflict: "user_id,modulo",
            });
            if (error) throw error;
        },
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ["permissoes", vars.userId] });
        },
    });

    return {
        permissoes: permissoesQuery.data,
        isLoadingPermissoes: permissoesQuery.isLoading,
        upsertingPermissoes: upsertPermissoes.isPending,
        upsertPermissoes: upsertPermissoes.mutateAsync,
    };
}
