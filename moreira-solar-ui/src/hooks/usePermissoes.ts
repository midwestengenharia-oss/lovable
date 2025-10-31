import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
            const res = await fetch(`/api/permissoes?userId=${userId}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao carregar permissões');
            return (await res.json()) as Permissao[];
        },
    });

    const upsertPermissoes = useMutation({
        mutationFn: async (payload: { userId: string; permissoes: Permissao[] }) => {
            const res = await fetch(`/api/permissoes/${payload.userId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ permissoes: payload.permissoes }),
            });
            if (!res.ok) throw new Error('Falha ao salvar permissões');
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
