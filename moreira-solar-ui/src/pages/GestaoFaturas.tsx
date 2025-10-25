import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Zap, Building2, Calendar, Users, Clock } from "lucide-react";
import { AutenticacaoForm } from "@/components/faturas/AutenticacaoForm";
import { UnidadesTable } from "@/components/faturas/UnidadesTable";
import { CompensacaoGraph } from "@/components/faturas/CompensacaoGraph";
import { CompensacaoTable } from "@/components/faturas/CompensacaoTable";
import { TitularCard } from "@/components/faturas/TitularCard";
import { ProcessamentoDialog } from "@/components/faturas/ProcessamentoDialog";
import { UnidadeDetailPanel } from "@/components/panels/UnidadeDetailPanel";
import { useTitularesEnergia } from "@/hooks/useTitularesEnergia";
import { useUnidadesConsumidoras, UnidadeConsumidora } from "@/hooks/useUnidadesConsumidoras";
import { useVinculosCompensacao } from "@/hooks/useVinculosCompensacao";
import { formatarMoeda } from "@/lib/calculadoraGC";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function GestaoFaturas() {
  const { titulares, isLoading: isLoadingTitulares } = useTitularesEnergia();
  const { unidades, isLoading: isLoadingUnidades } = useUnidadesConsumidoras();
  const { vinculos: vinculosCompensacao, isLoading: isLoadingVinculos } = useVinculosCompensacao();

  // TODO: Criar hooks para:
  // - sessoes_autenticacao (histórico de autenticações)
  // - processamentos_faturas (histórico de processamentos)
  const sessoesAutenticacao: any[] = [];
  const processamentosFaturas: any[] = [];
  const [activeTab, setActiveTab] = useState("autenticacao");
  const [selectedUCIds, setSelectedUCIds] = useState<string[]>([]);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [selectedUC, setSelectedUC] = useState<UnidadeConsumidora | null>(null);
  const [showUCPanel, setShowUCPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroTitularId, setFiltroTitularId] = useState("todos");
  const [filtroTitularSearch, setFiltroTitularSearch] = useState("");
  const [ordenacaoTitular, setOrdenacaoTitular] = useState("recentes");

  const handleUCClick = (uc: UnidadeConsumidora) => {
    setSelectedUC(uc);
    setShowUCPanel(true);
  };

  const getTitular = (titularId: string) => {
    return titulares.find((t) => t.id === titularId) || null;
  };

  // Filtros para Unidades
  const unidadesFiltradas = unidades.filter((uc) => {
    if (searchTerm && !uc.numeroUC.includes(searchTerm) && !uc.apelido?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filtroStatus !== "todas" && uc.status !== filtroStatus) return false;
    if (filtroTipo !== "todos" && uc.tipo !== filtroTipo) return false;
    if (filtroTitularId !== "todos" && uc.titularId !== filtroTitularId) return false;
    return true;
  });

  // Filtros para Titulares
  const titularesFiltrados = titulares.filter((t) => {
    if (filtroTitularSearch && !t.nome.toLowerCase().includes(filtroTitularSearch.toLowerCase()) && !t.cpfCnpj.includes(filtroTitularSearch)) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (ordenacaoTitular === "alfabetica") return a.nome.localeCompare(b.nome);
    if (ordenacaoTitular === "mais_ucs") {
      const aCount = unidades.filter((u) => u.titularId === a.id).length;
      const bCount = unidades.filter((u) => u.titularId === b.id).length;
      return bCount - aCount;
    }
    return new Date(b.dataCadastro || b.created_at || 0).getTime() - new Date(a.dataCadastro || a.created_at || 0).getTime();
  });

  // KPIs
  const totalUCs = unidades.length;
  const ucAtivas = unidades.filter((u) => u.status === "ativa").length;
  const ugis = unidades.filter((u) => u.tipo === "geradora_investimento").length;
  const ucbs = unidades.filter((u) => u.tipo.startsWith("beneficiaria_")).length;
  const faturamentoTotal = unidades.reduce((sum, u) => sum + (u.valorMedioFatura || 0), 0);

  const totalTitulares = titulares.length;
  const titularesPJ = titulares.filter((t) => t.cpfCnpj && t.cpfCnpj.length > 14).length;
  const titularesPF = totalTitulares - titularesPJ;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Gestão de Faturas</h1>
          <Badge variant="secondary">BETA</Badge>
        </div>
        <Button variant="outline" onClick={() => setActiveTab("autenticacao")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Autenticação
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="autenticacao">Nova Autenticação</TabsTrigger>
          <TabsTrigger value="unidades">Unidades Consumidoras</TabsTrigger>
          <TabsTrigger value="compensacao">Compensação</TabsTrigger>
          <TabsTrigger value="titulares">Titulares</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="autenticacao" className="space-y-4">
          <AutenticacaoForm />
        </TabsContent>

        <TabsContent value="unidades" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Total UCs</span>
                </div>
                <div className="text-2xl font-bold mt-1">{totalUCs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span>Ativas</span>
                </div>
                <div className="text-2xl font-bold mt-1">{ucAtivas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Distribuição</div>
                <div className="text-lg font-bold mt-1">
                  {ugis} GER | {ucbs} BEN
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Faturamento Total</div>
                <div className="text-2xl font-bold mt-1">{formatarMoeda(faturamentoTotal)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nº UC ou apelido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todos Status</SelectItem>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                    <SelectItem value="pendente_analise">Pendente Análise</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Tipos</SelectItem>
                    <SelectItem value="geradora_financiamento">UGF</SelectItem>
                    <SelectItem value="geradora_investimento">UGI</SelectItem>
                    <SelectItem value="beneficiaria_acr">UCB ACR</SelectItem>
                    <SelectItem value="beneficiaria_associacao">UCB Assoc</SelectItem>
                    <SelectItem value="convencional">Convencional</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroTitularId} onValueChange={setFiltroTitularId}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Titular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Titulares</SelectItem>
                    {titulares.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUCIds.length > 0 && (
                <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                  <span className="font-medium">{selectedUCIds.length} UC(s) selecionada(s)</span>
                  <Button onClick={() => setShowProcessDialog(true)}>
                    Processar Selecionadas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <UnidadesTable
            unidades={unidadesFiltradas}
            titulares={titulares}
            vinculos={vinculosCompensacao}
            selectedIds={selectedUCIds}
            onSelect={setSelectedUCIds}
            onUCClick={handleUCClick}
          />
        </TabsContent>

        <TabsContent value="compensacao" className="space-y-4">
          <Tabs defaultValue="grafo">
            <TabsList>
              <TabsTrigger value="grafo">Visualização em Rede</TabsTrigger>
              <TabsTrigger value="tabela">Tabela de Vínculos</TabsTrigger>
            </TabsList>

            <TabsContent value="grafo" className="mt-4">
              <CompensacaoGraph
                unidades={unidades}
                vinculos={vinculosCompensacao}
                titulares={titulares}
                onNodeClick={(ucId) => {
                  const uc = unidades.find((u) => u.id === ucId);
                  if (uc) handleUCClick(uc);
                }}
              />
            </TabsContent>

            <TabsContent value="tabela" className="mt-4">
              <CompensacaoTable
                unidades={unidades}
                vinculos={vinculosCompensacao}
                titulares={titulares}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="titulares" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Total Titulares</span>
                </div>
                <div className="text-2xl font-bold mt-1">{totalTitulares}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Distribuição</div>
                <div className="text-lg font-bold mt-1">{titularesPJ} PJ | {titularesPF} PF</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Acessos (30 dias)</span>
                </div>
                <div className="text-2xl font-bold mt-1">{sessoesAutenticacao.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou CPF/CNPJ..."
                    value={filtroTitularSearch}
                    onChange={(e) => setFiltroTitularSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={ordenacaoTitular} onValueChange={setOrdenacaoTitular}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recentes">Mais Recentes</SelectItem>
                    <SelectItem value="alfabetica">Alfabética</SelectItem>
                    <SelectItem value="mais_ucs">Mais UCs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {titularesFiltrados.map((titular) => (
              <TitularCard
                key={titular.id}
                titular={titular}
                unidades={unidades.filter((u) => u.titularId === titular.id)}
                onVerUnidades={() => {
                  setFiltroTitularId(titular.id);
                  setActiveTab("unidades");
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Qtd UCs</TableHead>
                    <TableHead>Processadas</TableHead>
                    <TableHead>Faturas</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processamentosFaturas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhum processamento realizado
                      </TableCell>
                    </TableRow>
                  ) : (
                    processamentosFaturas.map((proc) => (
                      <TableRow key={proc.id}>
                        <TableCell>
                          {format(new Date(proc.dataHora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              proc.status === "concluido"
                                ? "bg-green-100 text-green-800"
                                : proc.status === "erro"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {proc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{proc.qtdUCs}</TableCell>
                        <TableCell>{proc.processadas}/{proc.qtdUCs}</TableCell>
                        <TableCell>{proc.faturasBaixadas}</TableCell>
                        <TableCell>
                          {proc.tempoDecorrido ? `${Math.round(proc.tempoDecorrido / 1000)}s` : "-"}
                        </TableCell>
                        <TableCell>{proc.usuarioId || "Sistema"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Ver Detalhes</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProcessamentoDialog
        open={showProcessDialog}
        onOpenChange={setShowProcessDialog}
        selectedUCIds={selectedUCIds}
        unidades={unidades}
      />

      {selectedUC && (
        <UnidadeDetailPanel
          open={showUCPanel}
          onClose={() => setShowUCPanel(false)}
          unidade={selectedUC}
          titular={getTitular(selectedUC.titularId)}
          vinculos={vinculosCompensacao}
          todasUnidades={unidades}
        />
      )}
    </div>
  );
}
