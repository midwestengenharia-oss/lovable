import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Orcamento } from "@/types/supabase";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { useEquipamentos } from "@/hooks/useEquipamentos";
import { useParametros } from "@/hooks/useParametros";
import { useProjetos } from "@/hooks/useProjetos";
import { Plus, Search, Pencil, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { ViewToggle } from "@/components/kanban/ViewToggle";
import { KanbanBoard, KanbanColumnData } from "@/components/kanban/KanbanBoard";
import { KanbanCardData } from "@/components/kanban/KanbanCard";
import { SidePanel } from "@/components/panels/SidePanel";
import type { DropResult } from "@hello-pangea/dnd";

export default function Orcamentos() {
  const { orcamentos, isLoading, addOrcamento, updateOrcamento, deleteOrcamento } = useOrcamentos();
  const { modulos, inversores } = useEquipamentos();
  const { getParametro } = useParametros();
  const { addProjeto } = useProjetos();

  // Helper objects for compatibility with existing code
  const parametros = {
    potenciaPorPlacaWp: parseFloat(getParametro('potencia_por_placa_wp') || '550'),
    adicionalEstrutSoloPorPlaca: parseFloat(getParametro('adicional_estrut_solo_por_placa') || '150'),
    taxaJurosMes: parseFloat(getParametro('taxa_juros_mes') || '0.0199'),
    prazos: (getParametro('prazos') || [12, 24, 36, 48, 60]) as number[],
    numeroWhatsApp: getParametro('numero_whatsapp') || '5511999999999'
  };

  const catalogoPlacas = modulos.map(m => ({ id: m.id, nome: m.nome }));
  const catalogoInversores = inversores.map(i => ({ id: i.id, nome: i.nome }));

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrc, setEditingOrc] = useState<Orcamento | null>(null);
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);

  const [formData, setFormData] = useState<Omit<Orcamento, "id" | "numero" | "user_id">>({
    data: new Date().toISOString(),
    validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    cliente_id: null,
    cliente_nome: "",
    geracao_kwh: 0,
    qtd_modulos: 0,
    modelo_modulo: "",
    potencia_modulo_w: 550,
    inversor_kw: 0,
    valor_base: 0,
    custo_estrutura_solo: 0,
    valor_total: 0,
    estrutura_solo: false,
    parcela_selecionada: null,
    prestacao: null,
    economia_mensal: null,
    economia_percentual: null,
    payback_meses: null,
    status: "Rascunho",
    vendedor_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  // ==== CONFIGURAÇÃO DO USUÁRIO LOGADO ====

  const usuarioLogado = JSON.parse(sessionStorage.getItem("usuario_logado") || "{}");
  // Exemplo esperado: { id: "usr-001", nome: "Carlos Vendedor", tipo: "vendedor", gestor_id: "usr-010" }
  // tipo pode ser: "admin" | "gestor" | "vendedor"

  // Simulação temporária (remova quando tiver integração real)
  const todosUsuarios = [
    { id: "usr-001", nome: "Carlos Vendedor", tipo: "vendedor", gestor_id: "usr-010" },
    { id: "usr-002", nome: "Ana Comercial", tipo: "vendedor", gestor_id: "usr-010" },
    { id: "usr-010", nome: "Marcos Gestor", tipo: "gestor" },
    { id: "usr-999", nome: "Admin", tipo: "admin" },
  ];

  // Função que decide quem aparece no Select
  const getOpcoesDono = () => {
    if (usuarioLogado.tipo === "admin") {
      return todosUsuarios.filter((u) => u.tipo === "vendedor" || u.tipo === "gestor");
    }
    if (usuarioLogado.tipo === "gestor") {
      return todosUsuarios.filter((u) => u.tipo === "vendedor" && u.gestor_id === usuarioLogado.id);
    }
    return []; // vendedor não vê lista
  };


  const filteredOrcamentos = orcamentos.filter((orc) =>
    (orc.cliente_nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    orc.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (orc?: Orcamento) => {
    if (orc) {
      setEditingOrc(orc);
      setFormData(orc);
    } else {
      setEditingOrc(null);
      setFormData({
        data: new Date().toISOString(),
        validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        cliente_id: null,
        cliente_nome: "",
        geracao_kwh: 0,
        qtd_modulos: 0,
        modelo_modulo: "",
        potencia_modulo_w: 550,
        inversor_kw: 0,
        valor_base: 0,
        custo_estrutura_solo: 0,
        valor_total: 0,
        estrutura_solo: false,
        parcela_selecionada: null,
        prestacao: null,
        economia_mensal: null,
        economia_percentual: null,
        payback_meses: null,
        status: "Rascunho",
        vendedor_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    setDialogOpen(true);
  };

  const calcularDimensionamento = () => {
    const geracaoKwh = formData.geracao_kwh || 0;
    const kwpCalc = geracaoKwh / 120;
    const potenciaPlaca = (formData.potencia_modulo_w || parametros.potenciaPorPlacaWp) / 1000;
    const modulosCalc = Math.ceil(kwpCalc / potenciaPlaca);

    setFormData((prev) => ({ ...prev, qtd_modulos: modulosCalc }));
    toast.success("Dimensionamento calculado!");
  };

  const recalcularTotal = () => {
    const { valor_base, custo_estrutura_solo, estrutura_solo, qtd_modulos } = formData;
    const adicionalSolo = estrutura_solo ? parametros.adicionalEstrutSoloPorPlaca * qtd_modulos : 0;
    const totalCalc = valor_base + custo_estrutura_solo + adicionalSolo;
    setFormData((prev) => ({ ...prev, valor_total: parseFloat(totalCalc.toFixed(2)) }));
  };

  const calcularSimulacao = (prazo: number) => {
    const i = parametros.taxaJurosMes;
    const n = prazo;
    const pv = formData.valor_total || 0;

    if (pv === 0) return { pmt: 0, pv: 0 };

    // PMT = PV * i * (1+i)^n / ((1+i)^n - 1)
    const pmt = (pv * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);

    return { pmt: parseFloat(pmt.toFixed(2)), pv };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_nome || (formData.valor_total || 0) === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const now = new Date();
    const numero = `ORC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    if (editingOrc) {
      updateOrcamento({ id: editingOrc.id, ...formData });
    } else {
      addOrcamento({ numero, ...formData });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Excluir este orçamento?")) {
      deleteOrcamento(id);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pendente: { label: "Pendente", className: "bg-muted text-muted-foreground" },
      enviado: { label: "Enviado", className: "bg-primary text-primary-foreground" },
      aprovado: { label: "Aprovado", className: "bg-secondary text-secondary-foreground" },
      reprovado: { label: "Reprovado", className: "bg-destructive text-destructive-foreground" },
    };
    const statusInfo = statusMap[status || "pendente"] || statusMap.pendente;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const handleCardClick = (item: KanbanCardData) => {
    const orc = orcamentos.find((o) => o.id === item.id);
    if (orc) {
      setSelectedOrcamento(orc);
      setPanelOpen(true);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId as Orcamento["status"];
    const destStatus = result.destination.droppableId as Orcamento["status"];

    if (sourceStatus === destStatus) return;

    const orcamento = orcamentos.find((o) => o.id === result.draggableId);
    if (!orcamento) return;

    updateOrcamento({ id: orcamento.id, status: destStatus });
  };

  const handleAprovarOrcamento = (orc: Orcamento) => {
    updateOrcamento({ id: orc.id, status: "Aprovado" });
    const now = new Date();
    const numeroProjeto = `PRJ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

    addProjeto({
      cliente_id: orc.cliente_id || null, // <-- ✅ inclui o cliente_id
      cliente_nome: orc.cliente_nome || "",
      nome: orc.cliente_nome,
      numero: numeroProjeto,
      orcamento_id: orc.id,
      kwp: ((orc.qtd_modulos || 0) * (orc.potencia_modulo_w || 0)) / 1000,
      responsavel_id: orc.vendedor_id || null,
      status: "Vistoria",
      proximos_passos: "Realizar vistoria técnica no local",
      data_conclusao_prevista: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      prioridade: "Média",
      progresso: 0,
      checklist: [
        { id: "c1", titulo: "Solicitar documentação do cliente", concluido: false },
        { id: "c2", titulo: "Realizar vistoria técnica", concluido: false },
        { id: "c3", titulo: "Elaborar projeto elétrico", concluido: false },
        { id: "c4", titulo: "Registrar ART", concluido: false },
        { id: "c5", titulo: "Solicitar homologação", concluido: false },
      ],
      documentos: [],
      custos: {
        orcado: orc.valor_total,
        real: 0,
        itens: [],
      },
      timeline: [
        {
          id: `t-${Date.now()}`,
          data: new Date().toISOString(),
          titulo: "Projeto Iniciado",
          descricao: "Orçamento aprovado e projeto criado",
        },
      ],
    });

    toast.success("Orçamento aprovado e projeto criado!");
    setPanelOpen(false);
  };


  const kanbanColumns: KanbanColumnData[] = [
    {
      id: "Rascunho",
      title: "Rascunho",
      color: "#6b7280",
      items: orcamentos
        .filter((orc) => orc.status === "Rascunho")
        .map((orc) => ({
          id: orc.id,
          title: orc.numero,
          subtitle: orc.cliente_nome || "",
          badges: [
            { label: `${(((orc.qtd_modulos || 0) * (orc.potencia_modulo_w || 0)) / 1000).toFixed(2)} kWp`, variant: "outline" },
            {
              label: (orc.validade && new Date(orc.validade) < new Date()) ? "Expirado" : "Válido",
              variant: (orc.validade && new Date(orc.validade) < new Date()) ? "destructive" : "secondary"
            },
          ],
          metadata: {
            total: `R$ ${orc.valor_total.toLocaleString("pt-BR")}`,
            validade: orc.validade ? new Date(orc.validade).toLocaleDateString("pt-BR") : "N/A",
            dono: "Sistema",
          },
        })),
    },
    {
      id: "Enviado",
      title: "Enviado",
      color: "#3b82f6",
      items: orcamentos
        .filter((orc) => orc.status === "Enviado")
        .map((orc) => ({
          id: orc.id,
          title: orc.numero,
          subtitle: orc.cliente_nome || "",
          badges: [
            { label: `${(((orc.qtd_modulos || 0) * (orc.potencia_modulo_w || 0)) / 1000).toFixed(2)} kWp`, variant: "outline" },
            {
              label: (orc.validade && new Date(orc.validade) < new Date()) ? "Expirado" : "Válido",
              variant: (orc.validade && new Date(orc.validade) < new Date()) ? "destructive" : "secondary"
            },
          ],
          metadata: {
            total: `R$ ${orc.valor_total.toLocaleString("pt-BR")}`,
            validade: orc.validade ? new Date(orc.validade).toLocaleDateString("pt-BR") : "N/A",
            dono: "Sistema",
          },
        })),
    },
    {
      id: "Aprovado",
      title: "Aprovado",
      color: "#10b981",
      items: orcamentos
        .filter((orc) => orc.status === "Aprovado")
        .map((orc) => ({
          id: orc.id,
          title: orc.numero,
          subtitle: orc.cliente_nome || "",
          badges: [
            { label: `${(((orc.qtd_modulos || 0) * (orc.potencia_modulo_w || 0)) / 1000).toFixed(2)} kWp`, variant: "outline" },
            { label: "✓ Aprovado", variant: "secondary" },
          ],
          metadata: {
            total: `R$ ${orc.valor_total.toLocaleString("pt-BR")}`,
            validade: orc.validade ? new Date(orc.validade).toLocaleDateString("pt-BR") : "N/A",
            dono: "Sistema",
          },
        })),
    },
    {
      id: "Reprovado",
      title: "Reprovado",
      color: "#ef4444",
      items: orcamentos
        .filter((orc) => orc.status === "Reprovado")
        .map((orc) => ({
          id: orc.id,
          title: orc.numero,
          subtitle: orc.cliente_nome || "",
          badges: [
            { label: `${(((orc.qtd_modulos || 0) * (orc.potencia_modulo_w || 0)) / 1000).toFixed(2)} kWp`, variant: "outline" },
            { label: "✗ Reprovado", variant: "destructive" },
          ],
          metadata: {
            total: `R$ ${orc.valor_total.toLocaleString("pt-BR")}`,
            validade: orc.validade ? new Date(orc.validade).toLocaleDateString("pt-BR") : "N/A",
            dono: "Sistema",
          },
        })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orçamentos</h1>
        <div className="flex items-center gap-4">
          <ViewToggle view={view} onViewChange={setView} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrc ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <Tabs defaultValue="cliente">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="cliente">Cliente/Site</TabsTrigger>
                    <TabsTrigger value="dimensionamento">Dimensionamento</TabsTrigger>
                    <TabsTrigger value="precificacao">Precificação</TabsTrigger>
                    <TabsTrigger value="simulacao">Simulação</TabsTrigger>
                  </TabsList>

                  <TabsContent value="cliente" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cliente *</Label>
                        <Input value={formData.cliente_nome || ""} onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Telhado</Label>
                        <Select value={formData.tipoTelhado} onValueChange={(v) => setFormData({ ...formData, tipoTelhado: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cerâmico">Cerâmico</SelectItem>
                            <SelectItem value="Metálico">Metálico</SelectItem>
                            <SelectItem value="Fibrocimento">Fibrocimento</SelectItem>
                            <SelectItem value="Laje">Laje</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fase</Label>
                        <Select value={formData.fase} onValueChange={(v) => setFormData({ ...formData, fase: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monofásico">Monofásico</SelectItem>
                            <SelectItem value="Bifásico">Bifásico</SelectItem>
                            <SelectItem value="Trifásico">Trifásico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Dono</Label>

                        {usuarioLogado.tipo === "vendedor" ? (
                          // 👇 Se for vendedor, exibe nome fixo e salva o ID
                          <Input
                            value={usuarioLogado.nome}
                            disabled
                            className="bg-gray-100 dark:bg-gray-800"
                            onChange={() => { }}
                          />
                        ) : (
                          // 👇 Admin ou Gestor veem o Select normalmente
                          <Select
                            value={formData.dono}
                            onValueChange={(v) => {
                              const userSelecionado = todosUsuarios.find((u) => u.nome === v);
                              setFormData({
                                ...formData,
                                dono: v,
                                responsavel_id: userSelecionado ? userSelecionado.id : null,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {getOpcoesDono().map((user) => (
                                <SelectItem key={user.id} value={user.nome}>
                                  {user.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}


                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Input value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} />
                    </div>
                  </TabsContent>

                  <TabsContent value="dimensionamento" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Conta (R$)</Label>
                        <Input
                          type="number"
                          value={formData.geracao_kwh || ""}
                          onChange={(e) => setFormData({ ...formData, conta: parseFloat(e.target.value) || undefined })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Consumo (kWh/mês)</Label>
                        <Input
                          type="number"
                          value={formData.consumo || ""}
                          onChange={(e) => setFormData({ ...formData, consumo: parseFloat(e.target.value) || undefined })}
                        />
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={calcularDimensionamento}>Calcular Dimensionamento</Button>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>kWp Recomendado</Label>
                        <Input type="number" value={formData.kwp} onChange={(e) => setFormData({ ...formData, kwp: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Qtd de Placas</Label>
                        <Input type="number" value={formData.qtd_modulos || 0} onChange={(e) => setFormData({ ...formData, qtd_modulos: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Modelo de Placa</Label>
                        <Select value={formData.modelo_modulo || ""} onValueChange={(v) => setFormData({ ...formData, modelo_modulo: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {catalogoPlacas.map((p) => (
                              <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Inversor</Label>
                        <Select value={formData.inversor} onValueChange={(v) => setFormData({ ...formData, inversor: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {catalogoInversores.map((inv) => (
                              <SelectItem key={inv.id} value={inv.nome}>{inv.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="estruturaSolo"
                        checked={formData.estruturaSolo}
                        onCheckedChange={(checked) => setFormData({ ...formData, estruturaSolo: !!checked })}
                      />
                      <Label htmlFor="estruturaSolo" className="cursor-pointer">
                        Estrutura de solo (adiciona R$ {parametros.adicionalEstrutSoloPorPlaca.toFixed(2)} por placa)
                      </Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="precificacao" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Preço Base (R$)</Label>
                        <Input type="number" value={formData.precoBase} onChange={(e) => setFormData({ ...formData, precoBase: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Mão de Obra (R$)</Label>
                        <Input type="number" value={formData.maoDeObra} onChange={(e) => setFormData({ ...formData, maoDeObra: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Frete (R$)</Label>
                        <Input type="number" value={formData.frete} onChange={(e) => setFormData({ ...formData, frete: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Adicionais (R$)</Label>
                        <Input type="number" value={formData.custo_estrutura_solo || 0} onChange={(e) => setFormData({ ...formData, custo_estrutura_solo: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Desconto (R$)</Label>
                        <Input type="number" value={formData.desconto} onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Markup</Label>
                        <Input type="number" step="0.01" value={formData.markup} onChange={(e) => setFormData({ ...formData, markup: parseFloat(e.target.value) || 1 })} />
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={recalcularTotal}>Recalcular Total</Button>
                    <div className="p-4 bg-card border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total do Orçamento</p>
                      <p className="text-3xl font-bold">R$ {(formData.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="simulacao" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <Label>Taxa de Juros Mensal: {(parametros.taxaJurosMes * 100).toFixed(2)}%</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p className="font-mono text-xs">Fórmula: PV = PMT × (1 - (1+i)^-n) / i</p>
                              <p className="text-xs mt-1">onde i = taxa mensal, n = prazo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {parametros.prazos.map((prazo) => {
                        const { pmt, pv } = calcularSimulacao(prazo);
                        return (
                          <div key={prazo} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                            <div>
                              <p className="font-medium">{prazo}x</p>
                              <p className="text-sm text-muted-foreground">Valor Presente: R$ {pv.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                            </div>
                            <p className="text-xl font-bold">R$ {pmt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês</p>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por cliente ou número..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {view === "kanban" ? (
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
                <TableHead>Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sistema (kWp)</TableHead>
                <TableHead>Placas</TableHead>
                <TableHead>Estrutura Solo</TableHead>
                <TableHead>Total (R$)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrcamentos.map((orc) => (
                <TableRow key={orc.id}>
                  <TableCell className="font-medium">{orc.numero}</TableCell>
                  <TableCell>{orc.cliente_nome}</TableCell>
                  <TableCell>{(((orc.qtd_modulos || 0) * (orc.potencia_modulo_w || 0)) / 1000).toFixed(2)} kWp</TableCell>
                  <TableCell>{orc.qtd_modulos} un.</TableCell>
                  <TableCell>{orc.estrutura_solo ? "Sim" : "Não"}</TableCell>
                  <TableCell>R$ {orc.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{getStatusBadge(orc.status)}</TableCell>
                  <TableCell>{orc.validade}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(orc)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(orc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedOrcamento && (
        <SidePanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          title={selectedOrcamento.numero}
          description={selectedOrcamento.cliente_nome || ""}
          tabs={[
            {
              id: "detalhes",
              label: "Detalhes",
              content: (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{selectedOrcamento.cliente_nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(selectedOrcamento.status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sistema</p>
                      <p className="font-medium">{((selectedOrcamento.qtd_modulos || 0) * (selectedOrcamento.potencia_modulo_w || 0) / 1000).toFixed(2)} kWp ({selectedOrcamento.qtd_modulos} placas)</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Validade</p>
                      <p className="font-medium">{selectedOrcamento.validade ? new Date(selectedOrcamento.validade).toLocaleDateString("pt-BR") : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modelo da Placa</p>
                      <p className="font-medium">{selectedOrcamento.modelo_modulo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Inversor</p>
                      <p className="font-medium">{selectedOrcamento.inversor_kw ? `${selectedOrcamento.inversor_kw} kW` : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Telhado</p>
                      <p className="font-medium">N/A</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fase</p>
                      <p className="font-medium">N/A</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estrutura Solo</p>
                      <p className="font-medium">{selectedOrcamento.estrutura_solo ? "Sim" : "Não"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Responsável</p>
                      <p className="font-medium">Sistema</p>
                    </div>
                  </div>
                  <div className="p-4 bg-card border rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-3xl font-bold">R$ {selectedOrcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  {false && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Observações</p>
                      <p className="text-sm">{selectedOrcamento.observacoes}</p>
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: "simulacoes",
              label: "Simulações",
              content: (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Label>Taxa de Juros Mensal: {(parametros.taxaJurosMes * 100).toFixed(2)}%</Label>
                  </div>
                  {parametros.prazos.map((prazo) => {
                    const i = parametros.taxaJurosMes;
                    const n = prazo;
                    const pv = selectedOrcamento.valor_total;
                    const pmt = (pv * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);

                    return (
                      <div key={prazo} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                        <div>
                          <p className="font-medium">{prazo}x</p>
                          <p className="text-sm text-muted-foreground">
                            Total: R$ {pv.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <p className="text-xl font-bold">
                          R$ {pmt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                        </p>
                      </div>
                    );
                  })}
                </div>
              ),
            },
            {
              id: "acoes",
              label: "Ações",
              content: (
                <div className="space-y-4">
                  <Button
                    className="w-full"
                    onClick={() => handleOpenDialog(selectedOrcamento)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar Orçamento
                  </Button>

                  {selectedOrcamento.status !== "Aprovado" && (
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => handleAprovarOrcamento(selectedOrcamento)}
                    >
                      Aprovar Orçamento
                    </Button>
                  )}

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      const url = `https://wa.me/${parametros.numeroWhatsApp}?text=Olá! Gostaria de falar sobre o orçamento ${selectedOrcamento.numero}`;
                      window.open(url, "_blank");
                    }}
                  >
                    Enviar via WhatsApp
                  </Button>

                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Excluir este orçamento?")) {
                        deleteOrcamento(selectedOrcamento.id);
                        setPanelOpen(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Orçamento
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
