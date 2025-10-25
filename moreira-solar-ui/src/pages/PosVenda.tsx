import { useState } from "react";
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

type Chamado = {
  id: string;
  numero: string;
  cliente: string;
  tipo: "Manutenção" | "Garantia" | "Suporte" | "Limpeza";
  prioridade: "Baixa" | "Média" | "Alta";
  status: "Onboarding" | "Ativo" | "Manutenção" | "Chamado" | "Finalizado";
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

const stages: Chamado["status"][] = [
  "Onboarding",
  "Ativo",
  "Manutenção",
  "Chamado",
  "Finalizado",
];

export default function PosVenda() {
  const { chamados, isLoading, addChamado, updateChamado } = useChamados();
  const [view, setView] = useState<ViewMode>("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

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
      historico: [{
        id: `hist-${Date.now()}`,
        data: new Date().toISOString(),
        acao: "Chamado criado",
        usuario: "Sistema",
      }],
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

  const filteredChamados = chamados.filter(
    (c) =>
      c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const chamado = chamados.find((c) => c.id === result.draggableId);
    if (!chamado) return;

    const newStatus = stages[parseInt(result.destination.droppableId)];
    if (newStatus) {
      updateChamado(chamado.id, { 
        status: newStatus,
        historico: [
          ...chamado.historico,
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

  const transformToKanbanData = (chamados: Chamado[]): KanbanColumnData[] => {
    return stages.map((stage, index) => ({
      id: String(index),
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
              variant: chamado.prioridade === "Alta" ? "destructive" : 
                      chamado.prioridade === "Média" ? "secondary" : "outline"
            },
          ],
          avatar: chamado.tecnico ? {
            name: chamado.tecnico,
          } : undefined,
          metadata: {
            "Data": new Date(chamado.data).toLocaleDateString("pt-BR"),
          },
        })),
    }));
  };

  const handleCardClick = (item: KanbanCardData) => {
    const chamado = chamados.find((c) => c.id === item.id);
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
    const s = config[status];
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pós-venda</h1>
          <p className="text-muted-foreground">Gerencie chamados e suporte ao cliente</p>
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
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tecnico">Técnico Responsável</Label>
                  <Input
                    id="tecnico"
                    value={formData.tecnico}
                    onChange={(e) => setFormData({ ...formData, tecnico: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(v) => setFormData({ ...formData, tipo: v as Chamado["tipo"] })}
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
                      onValueChange={(v) => setFormData({ ...formData, prioridade: v as Chamado["prioridade"] })}
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
                    onValueChange={(v) => setFormData({ ...formData, status: v as Chamado["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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

      {view === "kanban" ? (
        <KanbanBoard
          columns={transformToKanbanData(filteredChamados)}
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
                  <TableCell>{new Date(chamado.data).toLocaleDateString("pt-BR")}</TableCell>
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
