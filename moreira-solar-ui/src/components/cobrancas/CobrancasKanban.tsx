import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanBoard, KanbanColumnData } from "@/components/kanban/KanbanBoard";
import { KanbanCardData } from "@/components/kanban/KanbanCard";
import { Cobranca } from "@/types/supabase";
import { useCobrancas } from "@/hooks/useCobrancas";
import { toast } from "sonner";

interface CobrancasKanbanProps {
  cobrancas: Cobranca[];
  onCobrancaClick: (id: string) => void;
}

export function CobrancasKanban({ cobrancas, onCobrancaClick }: CobrancasKanbanProps) {
  const { updateCobranca } = useCobrancas();

  const columns: KanbanColumnData[] = [
    {
      id: "A Gerar",
      title: "A Gerar",
      color: "bg-gray-500",
      items: cobrancas
        .filter((c) => c.status === "A Gerar")
        .map((c) => toKanbanCard(c)),
    },
    {
      id: "Enviado",
      title: "Enviado",
      color: "bg-purple-500",
      items: cobrancas
        .filter((c) => c.status === "Enviado")
        .map((c) => toKanbanCard(c)),
    },
    {
      id: "A Vencer",
      title: "A Vencer (7 dias)",
      color: "bg-yellow-500",
      items: cobrancas
        .filter((c) => {
          if (c.status !== "Enviado") return false;
          const venc = new Date(c.vencimento);
          const hoje = new Date();
          const diff = (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 7 && diff >= 0;
        })
        .map((c) => toKanbanCard(c)),
    },
    {
      id: "Atrasado",
      title: "Vencido",
      color: "bg-red-500",
      items: cobrancas
        .filter((c) => c.status === "Atrasado")
        .map((c) => toKanbanCard(c)),
    },
    {
      id: "Pago",
      title: "Pago",
      color: "bg-green-500",
      items: cobrancas
        .filter((c) => c.status === "Pago")
        .map((c) => toKanbanCard(c)),
    },
  ];

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const cobranca = cobrancas.find((c) => c.id === draggableId);
    if (!cobranca) return;

    const newStatus = destination.droppableId as Cobranca["status"];

    updateCobranca(cobranca.id, {
      status: newStatus,
      historicoStatus: [
        ...cobranca.historicoStatus,
        {
          status: newStatus,
          data: new Date().toISOString(),
          usuario: "Usuário Atual",
          obs: `Status alterado via Kanban de ${source.droppableId} para ${destination.droppableId}`,
        },
      ],
    });

    toast.success(`Cobrança movida para ${newStatus}`);
  };

  return <KanbanBoard columns={columns} onDragEnd={handleDragEnd} onCardClick={(item) => onCobrancaClick(item.id)} />;
}

function toKanbanCard(cobranca: Cobranca): KanbanCardData {
  return {
    id: cobranca.id,
    title: cobranca.clienteNome,
    subtitle: `${cobranca.numero} - ${cobranca.tipo}`,
    badges: cobranca.parcela ? [{ label: cobranca.parcela }] : [],
    avatar: cobranca.responsavel ? { name: cobranca.responsavel } : undefined,
    metadata: {
      Valor: `R$ ${cobranca.valor.toFixed(2)}`,
      Vencimento: new Date(cobranca.vencimento).toLocaleDateString("pt-BR"),
    },
  };
}
