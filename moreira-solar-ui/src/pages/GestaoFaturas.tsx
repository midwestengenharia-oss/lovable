import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Zap, Building2, Calendar, Users, Check, X, AlertCircle } from "lucide-react";
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
import { salvarUnidadesEnergisa, EnergisaUC } from "@/lib/salvarUnidadesEnergisa";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ENERGISA_API_BASE = "http://localhost:8000";

// Hook customizado para gerenciar a integração com API Energisa
function useEnergisaApi() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ucs, setUcs] = useState<EnergisaUC[]>([]);
  const [faturas, setFaturas] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tentar reaproveitar uma sess��o j�� existente ao carregar a tela
  useEffect(() => {
    const restoreSessionFromStorage = async () => {
      if (typeof window === "undefined") return;

      const storedSessionId = localStorage.getItem("energisa_session_id");
      if (!storedSessionId) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${ENERGISA_API_BASE}/status/${storedSessionId}`);

        if (!res.ok) {
          // Se a sess��o n��o existir mais, remove do storage
          if (res.status === 404) {
            localStorage.removeItem("energisa_session_id");
          }
          return;
        }

        const data = await res.json();

        // Se o backend retornar um status diferente de "autenticado",
        // consideramos que ainda precisa de SMS / novo login
        if (typeof data.status === "string" && data.status !== "autenticado") {
          return;
        }

        setSessionId(storedSessionId);
        setStatusMsg(data.message || "Sess��o Energisa j�� autenticada. Carregando UCs...");

        // Carregar UCs automaticamente para n��o precisar digitar o c��digo novamente
        try {
          const ucsRes = await fetch(`${ENERGISA_API_BASE}/api/ucs-full/${storedSessionId}`);
          const ucsData = await ucsRes.json();
          setUcs(ucsData.ucs || []);
          toast.success(`${(ucsData.ucs || []).length} UCs carregadas com sucesso!`);
        } catch (e: any) {
          setError(e.message || "Erro ao carregar UCs");
          toast.error(e.message || "Erro ao carregar UCs");
        }
      } catch (e) {
        console.error("Erro ao verificar sess��o Energisa:", e);
      } finally {
        setLoading(false);
      }
    };

    restoreSessionFromStorage();
  }, []);

  const iniciarLogin = async (cpf: string) => {
    if (!cpf || cpf.length !== 11) {
      setError("CPF inválido (11 dígitos).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ENERGISA_API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro ao iniciar login");
      setSessionId(data.session_id);
      setStatusMsg(data.message);

      // Guardar sess��o para reaproveitar em futuros acessos
      if (typeof window !== "undefined" && data.session_id) {
        localStorage.setItem("energisa_session_id", data.session_id);
      }
      toast.success("Login iniciado! Aguarde o código SMS.");
    } catch (e: any) {
      setError(e.message || "Erro ao iniciar login");
      toast.error(e.message || "Erro ao iniciar login");
    } finally {
      setLoading(false);
    }
  };

  const enviarSMS = async (codigo: string) => {
    if (!sessionId || !codigo) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ENERGISA_API_BASE}/api/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, codigo }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao enviar SMS");
      }
      toast.success("Código SMS validado com sucesso!");
      setStatusMsg("Autenticado! Carregando UCs...");

      // Aguardar um momento para o backend processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      await carregarUCs();
    } catch (e: any) {
      setError(e.message || "Erro ao enviar SMS");
      toast.error(e.message || "Erro ao enviar SMS");
    } finally {
      setLoading(false);
    }
  };

  const carregarUCs = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ENERGISA_API_BASE}/api/ucs-full/${sessionId}`);
      const data = await res.json();
      setUcs(data.ucs || []);
      toast.success(`${(data.ucs || []).length} UCs carregadas com sucesso!`);
      setStatusMsg(`✓ ${(data.ucs || []).length} UCs disponíveis para salvar`);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar UCs");
      toast.error(e.message || "Erro ao carregar UCs");
    } finally {
      setLoading(false);
    }
  };

  const carregarFaturas = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ENERGISA_API_BASE}/api/faturas/${sessionId}`);
      const data = await res.json();
      setFaturas(data.faturas || []);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar faturas");
    } finally {
      setLoading(false);
    }
  };

  const processarTodas = async () => {
    if (!sessionId) return;
    setError(null);
    await fetch(`${ENERGISA_API_BASE}/api/processar-todas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
  };

  return {
    sessionId,
    ucs,
    faturas,
    statusMsg,
    loading,
    error,
    setStatusMsg,
    setError,
    iniciarLogin,
    enviarSMS,
    carregarUCs,
    carregarFaturas,
    processarTodas,
  };
}

type EnergisaApiHook = ReturnType<typeof useEnergisaApi>;

// Painel de autenticação Energisa melhorado
function EnergisaAutenticacaoPanel({ energisa }: { energisa: EnergisaApiHook }) {
  const [cpf, setCpf] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [salvando, setSalvando] = useState(false);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Integração Energisa</p>
            <p className="text-xs text-muted-foreground">
              Login automático via CPF + SMS na API Energisa.
            </p>
            {energisa.statusMsg && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Check className="h-3 w-3" />
                {energisa.statusMsg}
              </p>
            )}
          </div>
          {energisa.sessionId && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              Sessão ativa
            </Badge>
          )}
        </div>

        {energisa.error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {energisa.error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Coluna 1: Login CPF */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">CPF (Energisa)</label>
            <Input
              placeholder="Somente números"
              value={cpf}
              maxLength={11}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
              disabled={!!energisa.sessionId}
            />
            <Button
              disabled={energisa.loading || !!energisa.sessionId}
              onClick={() => energisa.iniciarLogin(cpf)}
              className="w-full"
            >
              {energisa.loading ? "Processando..." : "🔐 Iniciar Login Energisa"}
            </Button>
          </div>

          {/* Coluna 2: Código SMS */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Código SMS</label>
            <Input
              placeholder="Código recebido"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
              disabled={!energisa.sessionId || energisa.loading}
            />
            <Button
              variant="default"
              disabled={!energisa.sessionId || energisa.loading || !smsCode}
              onClick={() => energisa.enviarSMS(smsCode)}
              className="w-full"
            >
              {energisa.loading ? "Validando..." : "✅ Confirmar Código SMS"}
            </Button>
          </div>
        </div>

        {/* Botão de salvar UCs - só aparece quando há UCs carregadas */}
        {energisa.ucs.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">UCs Disponíveis</p>
                <p className="text-xs text-muted-foreground">
                  {energisa.ucs.length} unidades prontas para salvar/atualizar
                </p>
              </div>
              <Badge variant="secondary">{energisa.ucs.length} UCs</Badge>
            </div>

            <Button
              variant="default"
              size="lg"
              disabled={salvando}
              onClick={async () => {
                setSalvando(true);
                try {
                  energisa.setStatusMsg("Processando UCs e informações de GD...");

                  // Buscar informações de GD se disponíveis
                  let gdInfo = [];
                  if (energisa.sessionId) {
                    try {
                      const gdRes = await fetch(`${ENERGISA_API_BASE}/api/gd-full/${energisa.sessionId}`);
                      if (gdRes.ok) {
                        const gdData = await gdRes.json();
                        gdInfo = gdData.gds || [];
                        console.log(`${gdInfo.length} registros de GD carregados`);
                      }
                    } catch (e) {
                      console.warn("Não foi possível carregar informações de GD:", e);
                    }
                  }

                  // Salvar com UPSERT completo e informações de GD
                  const resultado = await salvarUnidadesEnergisa(
                    energisa.ucs,
                    {
                      titularId: null,
                      clienteId: null,
                      projetoId: null,
                      userId: null,
                    },
                    gdInfo
                  );

                  energisa.setStatusMsg(
                    `✓ Processamento concluído: ${resultado.criadas} criadas, ${resultado.atualizadas} atualizadas`
                  );

                  toast.success("UCs salvas/atualizadas com sucesso!");
                } catch (error: any) {
                  energisa.setError(error.message || "Erro ao salvar UCs");
                  toast.error(error.message || "Erro ao salvar UCs");
                } finally {
                  setSalvando(false);
                }
              }}
              className="w-full"
            >
              {salvando ? (
                "⏳ Salvando..."
              ) : (
                "💾 Salvar/Atualizar UCs no Banco (com GD)"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente principal
export default function GestaoFaturas() {
  const [activeTab, setActiveTab] = useState("autenticacao");
  const [filtroTitularId, setFiltroTitularId] = useState<string | null>(null);
  const [filtroTitularSearch, setFiltroTitularSearch] = useState("");
  const [ordenacaoTitular, setOrdenacaoTitular] = useState("recentes");
  const [selectedUCIds, setSelectedUCIds] = useState<string[]>([]);
  const [selectedUC, setSelectedUC] = useState<UnidadeConsumidora | null>(null);
  const [showUCPanel, setShowUCPanel] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);

  const { titulares } = useTitularesEnergia();
  const { unidades, isLoading } = useUnidadesConsumidoras();
  const { vinculos: vinculosCompensacao } = useVinculosCompensacao();
  const energisa = useEnergisaApi();

  // Mock de processamentos para histórico
  const processamentosFaturas: any[] = [];
  const sessoesAutenticacao: any[] = [];

  const getTitular = (titularId: string | null | undefined) => {
    if (!titularId) return null;
    return titulares.find((t) => t.id === titularId);
  };

  const handleUCClick = (uc: UnidadeConsumidora) => {
    setSelectedUC(uc);
    setShowUCPanel(true);
  };

  const unidadesFiltradas = unidades.filter((uc) => {
    if (filtroTitularId && uc.titularId !== filtroTitularId) return false;
    return true;
  });

  const titularesFiltrados = titulares.filter((titular) => {
    if (filtroTitularSearch) {
      const search = filtroTitularSearch.toLowerCase();
      const nome = (titular.nome || "").toLowerCase();
      const doc = (titular.cpf_cnpj || "").toLowerCase();
      return nome.includes(search) || doc.includes(search);
    }
    return true;
  });

  const totalTitulares = titulares.length;
  const titularesPF = titulares.filter((t) => t.tipo_pessoa === "PF").length;
  const titularesPJ = titulares.filter((t) => t.tipo_pessoa === "PJ").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Faturas</h2>
          <p className="text-muted-foreground">
            Sistema completo de gerenciamento de faturas e geração distribuída
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="autenticacao">Autenticação</TabsTrigger>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
          <TabsTrigger value="compensacao">Compensação</TabsTrigger>
          <TabsTrigger value="titulares">Titulares</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="autenticacao" className="space-y-4">
          <EnergisaAutenticacaoPanel energisa={energisa} />

          {/* Tabela de UCs da API (preview antes de salvar) */}
          {energisa.ucs.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">UCs Carregadas da Energisa</h3>
                  <p className="text-sm text-muted-foreground">
                    Preview das unidades antes de salvar no banco
                  </p>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CDC/UC</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>UF</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Classe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {energisa.ucs.slice(0, 10).map((uc: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono">
                            {uc.cdc || uc.numeroUC || uc.numero}
                          </TableCell>
                          <TableCell>{uc.cidade || "-"}</TableCell>
                          <TableCell>{uc.uf || "-"}</TableCell>
                          <TableCell>{uc.grupo || "-"}</TableCell>
                          <TableCell>{uc.classe || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {energisa.ucs.length > 10 && (
                    <div className="p-2 text-center text-sm text-muted-foreground border-t">
                      ... e mais {energisa.ucs.length - 10} UCs
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unidades" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar unidades..." className="pl-9" />
                </div>
                <Select value={filtroTitularId || "todos"} onValueChange={(v) => setFiltroTitularId(v === "todos" ? null : v)}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Filtrar por titular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Titulares</SelectItem>
                    {titulares.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUCIds.length > 0 && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setShowProcessDialog(true)}>
                    Processar {selectedUCIds.length} Selecionada(s)
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedUCIds([])}>
                    Limpar Seleção
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
                onEdit={() => { }}
                onDelete={() => { }}
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
                <div className="text-lg font-bold mt-1">
                  {titularesPJ} PJ | {titularesPF} PF
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Acessos (30 dias)</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {sessoesAutenticacao.length}
                </div>
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
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        Nenhum processamento realizado
                      </TableCell>
                    </TableRow>
                  ) : (
                    processamentosFaturas.map((proc) => (
                      <TableRow key={proc.id}>
                        <TableCell>
                          {format(new Date(proc.dataHora), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
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
                        <TableCell>
                          {proc.processadas}/{proc.qtdUCs}
                        </TableCell>
                        <TableCell>{proc.faturasBaixadas}</TableCell>
                        <TableCell>
                          {proc.tempoDecorrido
                            ? `${Math.round(proc.tempoDecorrido / 1000)}s`
                            : "-"}
                        </TableCell>
                        <TableCell>{proc.usuarioId || "Sistema"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Ver Detalhes
                          </Button>
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
