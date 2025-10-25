import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/hooks/useLeads";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { usePropostas } from "@/hooks/usePropostas";
import { useProjetos } from "@/hooks/useProjetos";
import { TrendingUp, Users, FileText, DollarSign, Zap, CheckCircle } from "lucide-react";
import { Area, AreaChart, Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";

// ----------------------- utils de data e segurança -----------------------
const msPerDay = 24 * 60 * 60 * 1000;
const safeDate = (d: any) => {
  const dt = d ? new Date(d) : null;
  return isNaN(dt as any) ? null : dt;
};
const between = (d: Date, start: Date, end: Date) => d >= start && d <= end;

const asNumber = (n: any, fallback = 0) => (typeof n === "number" && isFinite(n) ? n : fallback);
const get = <T, K extends keyof T>(obj: T | undefined | null, key: K, fallback: any = undefined) =>
  obj && key in obj ? (obj as any)[key] : fallback;

// ----------------------- componente -----------------------
export default function Dashboard() {
  const { leads = [] } = useLeads();
  const { orcamentos = [] } = useOrcamentos();
  const { propostas = [] } = usePropostas();
  const { projetos = [] } = useProjetos();

  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "ytd">("30d");
  const [loadingUI, setLoadingUI] = useState(false);
  const handlePeriodChange = (value: "7d" | "30d" | "90d" | "ytd") => {
    setLoadingUI(true);
    setPeriod(value);
    setTimeout(() => setLoadingUI(false), 350);
  };

  // ----------------------- janelas de tempo -----------------------
  const now = new Date();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const startCurrent = new Date(now.getTime() - days * msPerDay);
  const startPrevious = new Date(startCurrent.getTime() - days * msPerDay);

  // Filtragem segura por data
  const filterByDate = <T extends Record<string, any>>(rows: T[], field = "created_at") => {
    const cur: T[] = [];
    const prev: T[] = [];
    for (const r of rows) {
      const dt = safeDate(get(r, field));
      if (!dt) continue;
      if (between(dt, startCurrent, now)) cur.push(r);
      else if (between(dt, startPrevious, startCurrent)) prev.push(r);
    }
    return { current: cur, previous: prev };
  };

  const leadsP = useMemo(() => filterByDate(leads, "created_at"), [leads, period]);
  const orcsP = useMemo(() => filterByDate(orcamentos, "created_at"), [orcamentos, period]);
  const propsP = useMemo(() => filterByDate(propostas, "created_at"), [propostas, period]);
  const projsP = useMemo(() => filterByDate(projetos, "created_at"), [projetos, period]);

  // variação %
  const pct = (cur: number, prev: number) => {
    if (!isFinite(prev) || !prev) return cur ? "+100%" : "0%";
    const d = ((cur - prev) / prev) * 100;
    const v = d.toFixed(1).replace("-0.0", "0.0");
    return `${d > 0 ? "+" : ""}${v}%`;
  };

  // ----------------------- cálculos KPIs -----------------------
  const leadsCur = leadsP.current.length;
  const leadsPrev = leadsP.previous.length;

  const orcAbertosCur = orcsP.current.filter(o => ["Enviado", "Rascunho"].includes(String(get(o, "status", "")))).length;
  const orcAbertosPrev = orcsP.previous.filter(o => ["Enviado", "Rascunho"].includes(String(get(o, "status", "")))).length;

  const propsAprovCur = propsP.current.filter(p => ["Aprovada", "Aceita"].includes(String(get(p, "status", ""))));
  const propsAprovPrev = propsP.previous.filter(p => ["Aprovada", "Aceita"].includes(String(get(p, "status", ""))));

  const taxaCur = leadsCur ? Math.round((propsAprovCur.length / leadsCur) * 100) : 0;
  const taxaPrev = leadsPrev ? Math.round((propsAprovPrev.length / leadsPrev) * 100) : 0;

  const ticketCur =
    propsAprovCur.length > 0
      ? propsAprovCur.reduce((s, p) => s + asNumber(get(p, "valor_total"), 0), 0) / propsAprovCur.length
      : 0;
  const ticketPrev =
    propsAprovPrev.length > 0
      ? propsAprovPrev.reduce((s, p) => s + asNumber(get(p, "valor_total"), 0), 0) / propsAprovPrev.length
      : 0;

  const receitaCur = propsP.current
    .filter(p => ["Enviada", "Em Negociação"].includes(String(get(p, "status", ""))))
    .reduce((s, p) => s + asNumber(get(p, "valor_total"), 0), 0);
  const receitaPrev = propsP.previous
    .filter(p => ["Enviada", "Em Negociação"].includes(String(get(p, "status", ""))))
    .reduce((s, p) => s + asNumber(get(p, "valor_total"), 0), 0);

  // kWp por projeto vem do orçamento atrelado ao mesmo cliente (fallback seguro)
  const kwpFromOrc = (clienteId: any) => {
    const orc = orcamentos.find(o => get(o, "cliente_id") === clienteId);
    const qtd = asNumber(get(orc, "qtd_modulos"), 0);
    const potW = asNumber(get(orc, "potencia_modulo_w"), 0);
    return (qtd * potW) / 1000;
  };

  const kwpCur = projsP.current
    .filter(p => ["Entrega", "Comissionamento"].includes(String(get(p, "status", ""))))
    .reduce((s, p) => s + kwpFromOrc(get(p, "cliente_id")), 0);

  const kwpPrev = projsP.previous
    .filter(p => ["Entrega", "Comissionamento"].includes(String(get(p, "status", ""))))
    .reduce((s, p) => s + kwpFromOrc(get(p, "cliente_id")), 0);

  // KPIs
  const kpis = [
    { title: "Novos Leads", value: leadsCur, icon: Users, change: pct(leadsCur, leadsPrev) },
    { title: "Orçamentos em Aberto", value: orcAbertosCur, icon: FileText, change: pct(orcAbertosCur, orcAbertosPrev) },
    { title: "Taxa de Conversão", value: `${taxaCur}%`, icon: TrendingUp, change: pct(taxaCur, taxaPrev) },
    {
      title: "Ticket Médio",
      value: `R$ ${ticketCur.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      change: pct(ticketCur, ticketPrev),
    },
    {
      title: "Receita Projetada",
      value: `R$ ${receitaCur.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      change: pct(receitaCur, receitaPrev),
    },
    { title: "kWp Instalados", value: `${kwpCur.toFixed(1)} kWp`, icon: Zap, change: pct(kwpCur, kwpPrev) },
  ];

  // ----------------------- gráficos dinâmicos -----------------------
  // sparkline usa série fictícia derivada de valores atuais (sem depender de histórico)
  const spark = (base: number) => [
    { value: base * 0.85 + 1 },
    { value: base * 0.9 + 2 },
    { value: base * 0.95 + 1 },
    { value: base * 1.0 + 3 },
    { value: base * 0.98 + 2 },
    { value: base * 1.05 + 4 },
    { value: base * 1.08 + 3 },
  ];

  // donut de conversão
  const conversionData = [
    { name: "Leads", value: leadsCur },
    { name: "Propostas", value: propsP.current.length },
    { name: "Projetos", value: projsP.current.length },
  ];
  const COLORS = ["#3b82f6", "#22c55e", "#f59e0b"];

  // kWp por mês (dinâmico, com base em created_at dos projetos finalizados)
  const kwpMensal = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projetos) {
      const status = String(get(p, "status", ""));
      if (!["Entrega", "Comissionamento"].includes(status)) continue;
      const dt = safeDate(get(p, "created_at"));
      if (!dt) continue;
      const label = dt.toLocaleString("pt-BR", { month: "short" });
      map.set(label, (map.get(label) || 0) + kwpFromOrc(get(p, "cliente_id")));
    }
    return Array.from(map.entries()).map(([mes, kwp]) => ({ mes, kwp: Number(kwp.toFixed(2)) }));
  }, [projetos, orcamentos]);

  // ----------------------- insights dinâmicos -----------------------
  const insights = useMemo(() => {
    const out: string[] = [];
    // leads
    out.push(
      leadsCur >= leadsPrev
        ? `🚀 Geração de leads aumentou ${pct(leadsCur, leadsPrev)} frente ao período anterior.`
        : `📉 Geração de leads caiu ${pct(leadsCur, leadsPrev)} frente ao período anterior.`
    );
    // taxa
    if (taxaCur !== taxaPrev) {
      out.push(
        taxaCur > taxaPrev
          ? `📈 A taxa de conversão melhorou (${taxaCur}% → ${taxaPrev}%).`
          : `⚠️ A taxa de conversão reduziu (${taxaPrev}% → ${taxaCur}%).`
      );
    } else {
      out.push(`ℹ️ A taxa de conversão manteve-se em ${taxaCur}%.`);
    }
    // ticket
    out.push(
      ticketCur >= ticketPrev
        ? `💰 Ticket médio subiu para R$ ${ticketCur.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}.`
        : `💸 Ticket médio caiu para R$ ${ticketCur.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}.`
    );
    // kwp
    out.push(
      kwpCur > 0
        ? kwpCur >= kwpPrev
          ? `⚡ Potência instalada cresceu ${pct(kwpCur, kwpPrev)}.`
          : `🔋 Potência instalada reduziu ${pct(kwpCur, kwpPrev)}.`
        : `🛠️ Nenhuma instalação concluída neste período.`
    );
    return out;
  }, [leadsCur, leadsPrev, taxaCur, taxaPrev, ticketCur, ticketPrev, kwpCur, kwpPrev]);

  // ----------------------- render -----------------------
  return (
    <div className="space-y-6">
      {/* header + seletor */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={period} onValueChange={v => handlePeriodChange(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="ytd">Ano até agora</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs com sparkline */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map(kpi => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingUI ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mb-2">
                    <span
                      className={
                        kpi.change.startsWith("+")
                          ? "text-success"
                          : kpi.change.startsWith("-")
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }
                    >
                      {kpi.change}
                    </span>{" "}
                    vs. período anterior
                  </p>

                  <div className="h-[50px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={spark(Number(String(kpi.value).replace(/[^\d.]/g, "")) || 0)}>
                        <defs>
                          <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} fill="url(#colorTrend)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* gráficos analíticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* conversão comercial (donut) */}
        <Card>
          <CardHeader>
            <CardTitle>Conversão Comercial</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={conversionData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {conversionData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* kwp por mês */}
        <Card>
          <CardHeader>
            <CardTitle>kWp Instalados por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={kwpMensal}>
                <defs>
                  <linearGradient id="kwpColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="kwp" stroke="#3b82f6" strokeWidth={2} fill="url(#kwpColor)" />
                <Tooltip />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.map((text, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle className="text-success h-4 w-4" />
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
