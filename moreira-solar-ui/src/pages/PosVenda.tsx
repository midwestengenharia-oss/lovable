// src/pages/PosVenda.tsx
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { KanbanBoard, KanbanColumnData } from "@/components/kanban/KanbanBoard";
import { KanbanCardData } from "@/components/kanban/KanbanCard";
import { ViewToggle } from "@/components/kanban/ViewToggle";
import { ChamadoDetailPanel } from "@/components/panels/ChamadoDetailPanel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { DropResult } from "@hello-pangea/dnd";
import { useChamados } from "@/hooks/useChamados";

/* ============================= Types ============================= */

type Chamado = {
  id: string;
  numero: string;
  cliente: string;
  tipo: "Manutenção" | "Garantia" | "Suporte" | "Limpeza";
  prioridade: "Baixa" | "Média" | "Alta";
  status: "Onboarding" | "Ativo" | "Manutenção" | "Chamado" | "Finalizado";
  substatus?: string | null;
  descricao: string;
  data: string;
  tecnico?: string;
  historico: Array<{
    id: string;
    data: string;
    acao: string;
    usuario: string;
  }>;
  fotos: string[];
};

type ViewMode = "kanban" | "lista";

type DBBoard = { id: string; slug: string; name: string; entity: string; active: boolean };
type DBColumn = {
  id: string; board_id: string; key: string; title: string; ord: number;
  terminal: boolean; active: boolean; wip_limit: number | null; sla_days: number | null;
  color_header: string | null; color_badge: string | null; update_patch: Record<string, any> | null;
};
type DBTransition = { id: string; board_id: string; from_column_id: string; to_column_id: string };

type LoadedBoard = {
  board: DBBoard;
  columns: DBColumn[];
  transitions: Record<string, string[]>;
} | null;

/* ============================= Hook: load board (slug/id) ============================= */

function useLoadedBoard(boardSlugOrId: string) {
  return useQuery({
    queryKey: ["kanban", "loaded", boardSlugOrId],
    queryFn: async (): Promise<LoadedBoard> => {
      // 👇 troca single() por maybeSingle()
      const { data: board, error: e1 } = await supabase
        .from("kanban_board")
        .select("*")
        .eq("slug", boardSlugOrId)
        .maybeSingle();

      if (e1) throw e1;
      if (!board) return null; // 👈 sem erro: deixa a tela usar o fallback

      const { data: cols, error: e2 } = await supabase
        .from("kanban_column")
        .select("*")
        .eq("board_id", board.id)
        .eq("active", true)
        .order("ord");
      if (e2) throw e2;

      const { data: trans, error: e3 } = await supabase
        .from("kanban_transition")
        .select("*")
        .eq("board_id", board.id);
      if (e3) throw e3;

      const transitions: Record<string, string[]> = {};
      (trans || []).forEach((t: DBTransition) => {
        transitions[t.from_column_id] ||= [];
        transitions[t.from_column_id].push(t.to_column_id);
      });

      return { board, columns: (cols || []) as DBColumn[], transitions };
    },
  });
}


/* ============================= Helpers: board logic ============================= */

function matchesColumn(ch: Chamado, col: DBColumn) {
  const patch = col.update_patch || {};
  return Object.entries(patch).every(([k, v]) => (ch as any)[k] === v);
}

function canMove(loaded: LoadedBoard, fromColId: string, toColId: string) {
  const allowTo = loaded.transitions[fromColId] || [];
  return allowTo.length === 0 ? true : allowTo.includes(toColId);
}

function chamadosToKanban(chamados: Chamado[], columns: DBColumn[]): KanbanColumnData[] {
  return columns.map((col) => ({
    id: col.id, // importante: usar o ID real da coluna no droppableId
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
          {
            label: ch.prioridade,
            variant:
              ch.prioridade === "Alta"
                ? "destructive"
                : ch.prioridade === "Média"
                  ? "secondary"
                  : "outline",
          },
        ],
        avatar: ch.tecnico ? { name: ch.tecnico } : undefined,
        metadata: { Data: new Date(ch.data).toLocaleDateString("pt-BR") },
      })),
  }));
}

/* ============================= Fallback (quando não existir board) ============================= */

const FALLBACK_STAGES: Chamado["status"][] = [
  "Onboarding",
  "Ativo",
  "Manutenção",
  "Chamado",
  "Finalizado",
];

function fallbackTransformToKanbanData(chamados: Chamado[]): KanbanColumnData[] {
  return FALLBACK_STAGES.map((stage, index) => ({
    id: String(index), // no fallback ainda usa índice
    title: stage,
    items: chamados
      .filter((c) => c.status === stage)
      .map((chamado): KanbanCardData => ({
        id: chamado.id,
        title: chamado.cliente,
        subtitle: `#${chamado.numero}`,
        badges: [
          { label: chamado.tipo, variant: "outline" },
          {
            label: chamado.prioridade,
            variant:
              chamado.prioridade === "Alta"
                ? "destructive"
                : chamado.prioridade === "Média"
                  ? "secondary"
                  : "outline",
          },
        ],
        avatar: chamado.tecnico ? { name: chamado.tecnico } : undefined,
        metadata: {
          Data: new Date(chamado.data).toLocaleDateString("pt-BR"),
        },
      })),
  }));
}

/* ============================= Page ============================= */

export default function PosVenda() {
  const { chamados, isLoading, addChamado, updateChamado } = useChamados();
  const [view, setView] = useState<ViewMode>("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // 🔑 Altere o slug abaixo para o que você criou no Admin (ex.: "pos-vendas")
  const { data: loaded, isLoading: loadingBoard, isError } = useLoadedBoard("pos-vendas");

  const [formData, setFormData] = useState({
    cliente: "",
    tipo: "Manutenção" as Chamado["tipo"],
    prioridade: "Média" as Chamado["prioridade"],
    status: "Onboarding" as Chamado["status"],
    descricao: "",
    tecnico: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addChamado({
      ...formData,
      data: new Date().toISOString(),
      historico: [
        {
          id: `hist-${Date.now()}`,
          data: new Date().toISOString(),
          acao: "Chamado criado",
          usuario: "Sistema",
        },
      ],
      fotos: [],
    });
    toast.success("Chamado criado com sucesso!");
    setDialogOpen(false);
    setFormData({
      cliente: "",
      tipo: "Manutenção",
      prioridade: "Média",
      status: "Onboarding",
      descricao: "",
      tecnico: "",
    });
  };

  const filteredChamados = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (chamados || []).filter(
      (c) =>
        c.cliente.toLowerCase().includes(term) ||
        c.numero.toLowerCase().includes(term)
    );
  }, [chamados, searchTerm]);

  // Drag & drop com board dinâmico (se houver). Senão, fallback por status fixo.
  const handleDragEnd = async (result: DropResult) => {
    const dest = result.destination;
    if (!dest) return;

    const chamado = (chamados || []).find((c) => c.id === result.draggableId);
    if (!chamado) return;

    // Se temos board carregado, usamos colunas e transições do Admin
    if (loaded && loaded.columns?.length) {
      const fromColId = result.source.droppableId;
      const toColId = dest.droppableId;

      if (fromColId === toColId) return;

      if (!canMove(loaded, fromColId, toColId)) {
        toast.error("Transição não permitida");
        return;
      }

      const targetCol = loaded.columns.find((c) => c.id === toColId);
      if (!targetCol) return;

      // WIP guard (opcional)
      if (typeof targetCol.wip_limit === "number") {
        const countInTarget = filteredChamados.filter((c) =>
          Object.entries(targetCol.update_patch || {}).every(([k, v]) => (c as any)[k] === v)
        ).length;
        if (countInTarget >= targetCol.wip_limit) {
          toast.error(`Limite WIP atingido em "${targetCol.title}"`);
          return;
        }
      }

      const patch = (targetCol.update_patch || {}) as Partial<Chamado>;

      try {
        await updateChamado(chamado.id, {
          ...patch,
          historico: [
            ...(chamado.historico ?? []),
            {
              id: `hist-${Date.now()}`,
              data: new Date().toISOString(),
              acao: `Movido para ${targetCol.title}`,
              usuario: "Sistema",
            },
          ],
        });
        toast.success(`Chamado movido para ${targetCol.title}`);
      } catch (e: any) {
        toast.error(`Falha ao mover: ${e?.message || "erro inesperado"}`);
      }
      return;
    }

    // Fallback (sem board): usa array fixo de stages
    const newStatus = FALLBACK_STAGES[parseInt(dest.droppableId, 10)];
    if (newStatus) {
      await updateChamado(chamado.id, {
        status: newStatus,
        historico: [
          ...(chamado.historico ?? []),
          {
            id: `hist-${Date.now()}`,
            data: new Date().toISOString(),
            acao: `Status alterado para ${newStatus}`,
            usuario: "Sistema",
          },
        ],
      });
      toast.success(`Chamado movido para ${newStatus}`);
    }
  };

  const handleCardClick = (item: KanbanCardData) => {
    const chamado = (chamados || []).find((c) => c.id === item.id);
    if (chamado) {
      setSelectedChamado(chamado);
      setPanelOpen(true);
    }
  };

  const getStatusBadge = (status: Chamado["status"]) => {
    const config = {
      Onboarding: { variant: "secondary" as const, label: "Onboarding" },
      Ativo: { variant: "default" as const, label: "Ativo" },
      Manutenção: { variant: "secondary" as const, label: "Manutenção" },
      Chamado: { variant: "destructive" as const, label: "Chamado" },
      Finalizado: { variant: "outline" as const, label: "Finalizado" },
    };
    const s = (config as any)[status];
    if (!s) return <Badge variant="outline">{status}</Badge>;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: Chamado["prioridade"]) => {
    const variants = {
      Baixa: "outline",
      Média: "secondary",
      Alta: "destructive",
    } as const;
    return <Badge variant={variants[prioridade]}>{prioridade}</Badge>;
  };

  const kanbanColumns: KanbanColumnData[] = useMemo(() => {
    // Com board dinâmico
    if (loaded && loaded.columns?.length) {
      return chamadosToKanban(filteredChamados, loaded.columns);
    }
    // Fallback
    return fallbackTransformToKanbanData(filteredChamados);
  }, [filteredChamados, loaded]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pós-venda</h1>
          <p className="text-muted-foreground">
            Gerencie chamados e suporte ao cliente
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={setView} />

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Chamado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Chamado</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) =>
                      setFormData({ ...formData, cliente: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tecnico">Técnico Responsável</Label>
                  <Input
                    id="tecnico"
                    value={formData.tecnico}
                    onChange={(e) =>
                      setFormData({ ...formData, tecnico: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          tipo: v as Chamado["tipo"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Garantia">Garantia</SelectItem>
                        <SelectItem value="Suporte">Suporte</SelectItem>
                        <SelectItem value="Limpeza">Limpeza</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select
                      value={formData.prioridade}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          prioridade: v as Chamado["prioridade"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status Inicial</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        status: v as Chamado["status"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FALLBACK_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Criar Chamado
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou número do chamado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading || loadingBoard ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : view === "kanban" ? (
        <KanbanBoard
          columns={kanbanColumns}
          onDragEnd={handleDragEnd}
          onCardClick={handleCardClick}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChamados.map((chamado) => (
                <TableRow
                  key={chamado.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedChamado(chamado);
                    setPanelOpen(true);
                  }}
                >
                  <TableCell className="font-medium">#{chamado.numero}</TableCell>
                  <TableCell>{chamado.cliente}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{chamado.tipo}</Badge>
                  </TableCell>
                  <TableCell>{getPrioridadeBadge(chamado.prioridade)}</TableCell>
                  <TableCell>{getStatusBadge(chamado.status)}</TableCell>
                  <TableCell>{chamado.tecnico || "-"}</TableCell>
                  <TableCell>
                    {new Date(chamado.data).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ChamadoDetailPanel
        chamado={selectedChamado}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUpdate={updateChamado}
      />
    </div>
  );
}
