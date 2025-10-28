// utils/kanbanPosVendas.ts
import { DBColumn } from "@/hooks/useBoardConfigFromDB";
import { KanbanColumnData } from "@/components/kanban/KanbanBoard";
import { KanbanCardData } from "@/components/kanban/KanbanCard";

type Chamado = /* o teu Chamado */ any;

export function matchesColumn(c: Chamado, col: DBColumn) {
    const patch = col.update_patch || {};
    return Object.entries(patch).every(([k, v]) => {
        // igualdade direta (ex.: status, substatus, etc.)
        return (c as any)[k] === v;
    });
}

export function chamadosToKanban(chamados: Chamado[], columns: DBColumn[]): KanbanColumnData[] {
    return columns.map((col) => ({
        id: col.id,                  // 👈 usa o id real da coluna
        title: col.title,
        wipLimit: col.wip_limit ?? undefined,
        items: chamados
            .filter((c) => matchesColumn(c, col))
            .map<KanbanCardData>((ch) => ({
                id: ch.id,
                title: ch.cliente,
                subtitle: `#${ch.numero}`,
                badges: [
                    { label: ch.tipo, variant: "outline" },
                    { label: ch.prioridade, variant: ch.prioridade === "Alta" ? "destructive" : ch.prioridade === "Média" ? "secondary" : "outline" },
                ],
                avatar: ch.tecnico ? { name: ch.tecnico } : undefined,
                metadata: { "Data": new Date(ch.data).toLocaleDateString("pt-BR") },
            })),
    }));
}
