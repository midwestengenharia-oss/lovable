import { useState } from "react";
import { SidePanel } from "./SidePanel";
import { UnidadeConsumidora, TitularEnergia, VinculoCompensacao } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatarMoeda, formatarPorcentagem } from "@/lib/calculadoraGC";
import { Pencil, Download, Trash2, ExternalLink, TrendingUp, DollarSign, Zap } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UnidadeDetailPanelProps {
  open: boolean;
  onClose: () => void;
  unidade: UnidadeConsumidora | null;
  titular: TitularEnergia | null;
  vinculos: VinculoCompensacao[];
  todasUnidades: UnidadeConsumidora[];
}

export function UnidadeDetailPanel({
  open,
  onClose,
  unidade,
  titular,
  vinculos,
  todasUnidades,
}: UnidadeDetailPanelProps) {
  const [apelidoEdit, setApelidoEdit] = useState("");

  if (!unidade || !titular) return null;

  const isUGI = unidade.tipo === "geradora_investimento";
  const isUGF = unidade.tipo === "geradora_financiamento";
  const isUCB = unidade.tipo.startsWith("beneficiaria_");
  const isGeradora = isUGI || isUGF;

  // Mock data for charts
  const faturasChartData = unidade.faturas.slice(0, 6).reverse().map((f) => ({
    mes: f.mesReferencia.substring(5, 7),
    consumo: f.consumo,
    valor: f.valorConta,
  }));

  const vinculosUGI = vinculos.filter((v) => v.ugiId === unidade.id && v.ativo);
  const vinculosUCB = vinculos.filter((v) => v.ucbId === unidade.id && v.ativo);
  const totalCompensacao = isUGI ? vinculosUGI.reduce((sum, v) => sum + v.percentualCompensacao, 0) : 0;
  const sobra = 100 - totalCompensacao;

  // Tabs dinâmicas baseadas no tipo de UC
  const tabs = [
    {
      id: "info",
      label: "Informações",
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Unidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número UC</Label>
                  <p className="font-semibold">{unidade.numeroUC}</p>
                </div>
                <div>
                  <Label>Apelido</Label>
                  <Input
                    value={apelidoEdit || unidade.apelido || ""}
                    onChange={(e) => setApelidoEdit(e.target.value)}
                    placeholder="Apelido da UC"
                  />
                </div>
                <div>
                  <Label>Titular</Label>
                  <p className="font-semibold">{titular.nome}</p>
                </div>
                <div>
                  <Label>Concessionária</Label>
                  <Badge>{titular.concessionaria.toUpperCase()}</Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={unidade.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="inativa">Inativa</SelectItem>
                      <SelectItem value="pendente_analise">Pendente Análise</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cliente Vinculado</Label>
                  {unidade.clienteId ? (
                    <Button variant="link" className="p-0 h-auto">
                      Ver Cliente <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  ) : (
                    <p className="text-muted-foreground">Não vinculado</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label>Endereço Completo</Label>
                <p>{unidade.endereco}, {unidade.cidade}/{unidade.estado}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="default">
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Faturas
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "faturas",
      label: "Faturas",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Média Mensal</div>
                <div className="text-2xl font-bold">{formatarMoeda(unidade.valorMedioFatura)}</div>
                <div className="text-xs text-muted-foreground">{unidade.faturamentoMedioKwh} kWh</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Saldo Atual</div>
                <div className="text-2xl font-bold">
                  {unidade.ultimaFatura ? `${unidade.ultimaFatura.saldo} kWh` : "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Créditos a Expirar</div>
                <div className="text-2xl font-bold">0 kWh</div>
                <div className="text-xs text-muted-foreground">Próximo ciclo</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Consumo/Injeção (kWh)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={faturasChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="consumo" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valores (R$)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={faturasChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PDFs das Faturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                PDFs serão disponibilizados após integração com backend (Fase 10B)
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  // Aba Compensação (apenas UCBs)
  if (isUCB) {
    tabs.push({
      id: "compensacao",
      label: "Compensação",
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Compensação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Recebe de:</span>
                  <span className="font-semibold">{vinculosUCB.length} geradora(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Compensação:</span>
                  <span className="font-semibold">
                    {formatarPorcentagem(vinculosUCB.reduce((s, v) => s + v.percentualCompensacao, 0) / 100)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Créditos Mensais:</span>
                  <span className="font-semibold">~{unidade.faturamentoMedioKwh} kWh</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vínculos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vinculosUCB.map((v) => {
                  const ugi = todasUnidades.find((u) => u.id === v.ugiId);
                  return (
                    <div key={v.id} className="flex justify-between items-center p-2 border rounded">
                      <span>{ugi?.apelido || ugi?.numeroUC}</span>
                      <Badge>{formatarPorcentagem(v.percentualCompensacao / 100)}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    });
  }

  // Aba Beneficiárias Vinculadas (apenas UGIs)
  if (isUGI) {
    tabs.push({
      id: "beneficiarias",
      label: "Beneficiárias",
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Distribuição de Créditos</CardTitle>
              <Button size="sm">Adicionar Beneficiária</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {vinculosUGI.map((v) => {
                const ucb = todasUnidades.find((u) => u.id === v.ucbId);
                return (
                  <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{ucb?.apelido || ucb?.numeroUC}</div>
                      <div className="text-sm text-muted-foreground">
                        {v.modeloCompensacao.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={v.percentualCompensacao}
                        className="w-20"
                        min="0"
                        max="100"
                      />
                      <span>%</span>
                      <Button size="sm" variant="outline">Salvar</Button>
                    </div>
                  </div>
                );
              })}

              <Separator />

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatarPorcentagem(totalCompensacao / 100)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Sobra:</span>
                  <span className={sobra > 5 ? "text-yellow-600" : "text-green-600"}>
                    {formatarPorcentagem(sobra / 100)}
                  </span>
                </div>
                {sobra > 5 && (
                  <div className="text-sm text-yellow-600 flex items-center gap-1">
                    ⚠️ Alta sobra detectada. Considere rebalanceamento.
                  </div>
                )}
              </div>

              <Button className="w-full" variant="secondary">
                Rebalancear Automático
              </Button>
            </CardContent>
          </Card>
        </div>
      ),
    });
  }

  // Aba Análise (apenas UGF e UGI)
  if (isGeradora) {
    tabs.push({
      id: "analise",
      label: "Análise",
      content: (
        <div className="space-y-4">
          {isUGF && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <span>Injeção Média</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{unidade.faturamentoMedioKwh} kWh</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Economia Mensal</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{formatarMoeda(unidade.valorMedioFatura)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Economia Acumulada</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {formatarMoeda(unidade.valorMedioFatura * unidade.faturas.length)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Saldo Atual</div>
                    <div className="text-2xl font-bold mt-1">
                      {unidade.ultimaFatura?.saldo || 0} kWh
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button className="w-full">Gerar Relatório PDF</Button>
            </>
          )}

          {isUGI && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Injeção Média</div>
                    <div className="text-2xl font-bold">{unidade.faturamentoMedioKwh} kWh</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Energia Vendida</div>
                    <div className="text-2xl font-bold">
                      {Math.round((unidade.faturamentoMedioKwh * totalCompensacao) / 100)} kWh
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Sobra %</div>
                    <div className="text-2xl font-bold">{formatarPorcentagem(sobra / 100)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Receita Mensal</div>
                    <div className="text-2xl font-bold">{formatarMoeda(unidade.valorMedioFatura * 0.7)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">ROI</div>
                    <div className="text-2xl font-bold">12.5%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Payback</div>
                    <div className="text-2xl font-bold">6.2 anos</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Gerar Relatório PDF</Button>
                <Button className="flex-1" variant="secondary">Criar Proposta</Button>
              </div>
            </>
          )}
        </div>
      ),
    });
  }

  // Aba Histórico (todas UCs)
  tabs.push({
    id: "historico",
    label: "Histórico",
    content: (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Timeline de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 bg-primary rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Cadastro da UC</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(unidade.dataCadastro), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unidade consumidora cadastrada no sistema
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  });

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={`UC ${unidade.numeroUC}`}
      description={unidade.apelido || `${unidade.cidade}/${unidade.estado}`}
      tabs={tabs}
    />
  );
}
