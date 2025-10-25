import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/hooks/useLeads";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { usePropostas } from "@/hooks/usePropostas";
import { useProjetos } from "@/hooks/useProjetos";
import { TrendingUp, Users, FileText, DollarSign, Zap, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const { leads, isLoading: isLoadingLeads } = useLeads();
  const { orcamentos, isLoading: isLoadingOrcamentos } = useOrcamentos();
  const { propostas, isLoading: isLoadingPropostas } = usePropostas();
  const { projetos, isLoading: isLoadingProjetos } = useProjetos();

  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(false);

  const handlePeriodChange = (value: string) => {
    setLoading(true);
    setPeriod(value);
    setTimeout(() => setLoading(false), 400);
  };

  const isAnyLoading = isLoadingLeads || isLoadingOrcamentos || isLoadingPropostas || isLoadingProjetos;

  // Calculate funilComercial based on lead statuses
  const funilComercial = useMemo(() => {
    const novoLeads = leads.filter(l => l.status === "Novo").length;
    const qualificadoLeads = leads.filter(l => l.status === "Qualificado").length;
    const orcamentosEnviados = orcamentos.filter(o => o.status === "Enviado").length;
    const propostasEmNegociacao = propostas.filter(p => p.status === "Em Negociação" || p.status === "Enviada").length;
    const propostasAceitas = propostas.filter(p => p.status === "Aprovada" || p.status === "Aceita").length;

    const total = Math.max(novoLeads + qualificadoLeads, 1);

    return [
      { stage: "Novo", count: novoLeads, percentage: 100 },
      { stage: "Qualificado", count: qualificadoLeads, percentage: Math.round((qualificadoLeads / total) * 100) },
      { stage: "Orçamento Enviado", count: orcamentosEnviados, percentage: Math.round((orcamentosEnviados / total) * 100) },
      { stage: "Negociação", count: propostasEmNegociacao, percentage: Math.round((propostasEmNegociacao / total) * 100) },
      { stage: "Ganhou", count: propostasAceitas, percentage: Math.round((propostasAceitas / total) * 100) },
    ];
  }, [leads, orcamentos, propostas]);

  // Calculate pipelineObra based on project statuses
  const pipelineObra = useMemo(() => {
    const statusCount = {
      "Vistoria": 0,
      "Projeto/ART": 0,
      "Homologação": 0,
      "Compra": 0,
      "Instalação": 0,
      "Comissionamento": 0,
      "Entrega": 0,
    };

    projetos.forEach(projeto => {
      if (projeto.status && statusCount.hasOwnProperty(projeto.status)) {
        statusCount[projeto.status as keyof typeof statusCount]++;
      }
    });

    return Object.entries(statusCount).map(([stage, count]) => ({ stage, count }));
  }, [projetos]);

  // Calculate KPIs
  const orcamentosAbertos = orcamentos.filter(o => o.status === "Enviado" || o.status === "Rascunho").length;
  const totalLeadsConvertidos = propostas.filter(p => p.status === "Aprovada" || p.status === "Aceita").length;
  const taxaConversao = leads.length > 0 ? Math.round((totalLeadsConvertidos / leads.length) * 100) : 0;

  const valorTotalPropostas = propostas
    .filter(p => p.status === "Aprovada" || p.status === "Aceita")
    .reduce((sum, p) => sum + (p.valor_total || 0), 0);
  const ticketMedio = totalLeadsConvertidos > 0 ? valorTotalPropostas / totalLeadsConvertidos : 0;

  const receitaProjetada = propostas
    .filter(p => p.status === "Enviada" || p.status === "Em Negociação")
    .reduce((sum, p) => sum + (p.valor_total || 0), 0);

  const kwpInstalados = projetos
    .filter(p => p.status === "Entrega" || p.status === "Comissionamento")
    .reduce((sum, p) => {
      // Assuming we can get kWp from orcamentos linked to projetos
      const orcamento = orcamentos.find(o => o.cliente_id === p.cliente_id);
      return sum + ((orcamento?.qtd_modulos || 0) * (orcamento?.potencia_modulo_w || 0) / 1000);
    }, 0);

  const kpis = [
    { title: "Novos Leads", value: leads.length, icon: Users, change: "+12%" },
    { title: "Orçamentos em Aberto", value: orcamentosAbertos, icon: FileText, change: "+5%" },
    { title: "Taxa de Conversão", value: `${taxaConversao}%`, icon: TrendingUp, change: "+3%" },
    { title: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign, change: "+8%" },
    { title: "Receita Projetada", value: `R$ ${receitaProjetada.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign, change: "+15%" },
    { title: "kWp Instalados", value: `${kwpInstalados.toFixed(1)} kWp`, icon: Zap, change: "+20%" },
  ];

  const insights = [
    "Ciclo médio de vendas: 18 dias (melhor que mês anterior)",
    "Fonte com melhor conversão: Indicação (45%)",
    "Pico de novos leads: terça-feira às 14h",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading || isAnyLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-success">{kpi.change}</span> vs. período anterior
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funil Comercial */}
      <Card>
        <CardHeader>
          <CardTitle>Funil Comercial</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || isAnyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {funilComercial.map((stage) => (
                <div key={stage.stage} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">{stage.stage}</div>
                  <div className="flex-1 relative h-10 bg-muted rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary flex items-center px-3 text-primary-foreground text-sm font-medium transition-all"
                      style={{ width: `${stage.percentage}%` }}
                    >
                      {stage.count}
                    </div>
                  </div>
                  <div className="w-12 text-sm text-muted-foreground text-right">{stage.percentage}%</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline da Obra */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline da Obra</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || isAnyLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-24 flex-1" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {pipelineObra.map((stage) => (
                <div key={stage.stage} className="flex flex-col items-center gap-2">
                  <div className="w-full aspect-square bg-card border-2 border-border rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold">{stage.count}</span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">{stage.stage}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
