import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCobrancas } from "@/hooks/useCobrancas";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { useClientes } from "@/hooks/useClientes";
import { CobrancasList } from "@/components/cobrancas/CobrancasList";
import { CobrancasKanban } from "@/components/cobrancas/CobrancasKanban";
import { ViewToggle } from "@/components/kanban/ViewToggle";
import { CobrancaDetailPanel } from "@/components/panels/CobrancaDetailPanel";
import { Receipt, TrendingUp, DollarSign, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Cobrancas() {
  const { cobrancas, isLoading: isLoadingCobrancas } = useCobrancas();
  const { orcamentos, isLoading: isLoadingOrcamentos } = useOrcamentos();
  const { clientes, isLoading: isLoadingClientes } = useClientes();

  const [viewMode, setViewMode] = useState<"lista" | "kanban">("lista");
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("all");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");
  const [panelOpen, setPanelOpen] = useState(false);
  const [cobrancaSelecionada, setCobrancaSelecionada] = useState<string | null>(null);
  const [gerarDialogOpen, setGerarDialogOpen] = useState(false);

  // Filtros
  const cobrancasFiltradas = cobrancas.filter((c) => {
    const matchSearch =
      (c.cliente_nome?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.numero?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchTipo = tipoFiltro === "all" || c.tipo === tipoFiltro;
    const matchStatus = statusFiltro === "all" || c.status === statusFiltro;
    return matchSearch && matchTipo && matchStatus;
  });

  // KPIs
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const aReceberMes = cobrancas
    .filter((c) => {
      const venc = new Date(c.vencimento);
      return venc.getMonth() === mesAtual && venc.getFullYear() === anoAtual && c.status !== "Pago" && c.status !== "Cancelado";
    })
    .reduce((sum, c) => sum + c.valor, 0);

  const recebidoMes = cobrancas
    .filter((c) => {
      const pag = c.data_pagamento ? new Date(c.data_pagamento) : null;
      return pag && pag.getMonth() === mesAtual && pag.getFullYear() === anoAtual && c.status === "Pago";
    })
    .reduce((sum, c) => sum + (c.valor_pago || c.valor), 0);

  const atrasados = cobrancas.filter((c) => c.status === "Atrasado");
  const totalAtrasado = atrasados.reduce((sum, c) => sum + c.valor, 0);

  const taxaInadimplencia = cobrancas.length > 0 ? (atrasados.length / cobrancas.length) * 100 : 0;

  const handleOpenPanel = (id: string) => {
    setCobrancaSelecionada(id);
    setPanelOpen(true);
  };

  // State para geração automática
  const [tipoGeracao, setTipoGeracao] = useState<"Financiamento" | "Geração Compartilhada">("Financiamento");
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState("");
  const [clienteGCSelecionado, setClienteGCSelecionado] = useState("");
  const [valorMensalGC, setValorMensalGC] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("10");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const handleGerarCobrancas = () => {
    if (tipoGeracao === "Financiamento" && !orcamentoSelecionado) {
      toast.error("Selecione um orçamento aprovado");
      return;
    }
    if (tipoGeracao === "Geração Compartilhada" && (!clienteGCSelecionado || !valorMensalGC)) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (!dataInicio) {
      toast.error("Informe a data de início");
      return;
    }

    // TODO: Implement automatic billing generation with Supabase
    toast.info("Funcionalidade de geração automática em desenvolvimento");
    setGerarDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Cobranças</h1>
        <Button onClick={() => setGerarDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Gerar Cobranças Automáticas
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Receber (Mês Atual)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {aReceberMes.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recebido (Mês Atual)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {recebidoMes.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ {totalAtrasado.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{atrasados.length} cobrança(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa Inadimplência</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaInadimplencia.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por cliente ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="Financiamento">Financiamento</SelectItem>
                <SelectItem value="Geração Compartilhada">Geração Compartilhada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="A Gerar">A Gerar</SelectItem>
                <SelectItem value="Gerado">Gerado</SelectItem>
                <SelectItem value="Enviado">Enviado</SelectItem>
                <SelectItem value="A Vencer">A Vencer</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
                <SelectItem value="Pendente Aprovação">Pendente Aprovação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      {viewMode === "lista" ? (
        <CobrancasList cobrancas={cobrancasFiltradas} onCobrancaClick={handleOpenPanel} />
      ) : (
        <CobrancasKanban cobrancas={cobrancasFiltradas} onCobrancaClick={handleOpenPanel} />
      )}

      {/* Side Panel */}
      <CobrancaDetailPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        cobrancaId={cobrancaSelecionada}
      />

      {/* Dialog Gerar Cobranças */}
      <Dialog open={gerarDialogOpen} onOpenChange={setGerarDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerar Cobranças Automáticas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Cobrança</Label>
              <Select value={tipoGeracao} onValueChange={(v) => setTipoGeracao(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Financiamento">Financiamento</SelectItem>
                  <SelectItem value="Geração Compartilhada">Geração Compartilhada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoGeracao === "Financiamento" && (
              <div className="space-y-2">
                <Label>Orçamento Aprovado</Label>
                <Select value={orcamentoSelecionado} onValueChange={setOrcamentoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar orçamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {orcamentos
                      .filter((o) => o.status === "Aprovado" && o.tipo_calculadora === "financiamento")
                      .map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.numero} - {o.cliente_nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tipoGeracao === "Geração Compartilhada" && (
              <>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={clienteGCSelecionado} onValueChange={setClienteGCSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorMensalGC}
                    onChange={(e) => setValorMensalGC(e.target.value)}
                    placeholder="450.00"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data Fim (opcional)</Label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dia do Vencimento</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setGerarDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGerarCobrancas}>Gerar Cobranças</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
