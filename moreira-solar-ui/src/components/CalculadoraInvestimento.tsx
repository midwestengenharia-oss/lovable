import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEquipamentos } from "@/hooks/useEquipamentos";
import { useParametros } from "@/hooks/useParametros";
import { useClientes } from "@/hooks/useClientes";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { ClienteDialog } from "@/components/ClienteDialog";
import { executarSimulacao, formatarMoeda, formatarPorcentagem, SimulacaoResult } from "@/lib/calculadoraSolar";
import { toast } from "sonner";
import { TrendingUp, DollarSign, Calculator } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function CalculadoraInvestimento() {
  const { equipamentos } = useEquipamentos();
  const { parametros } = useParametros();
  const { clientes } = useClientes();
  const { addOrcamento } = useOrcamentos();
  const [modoCalculo, setModoCalculo] = useState<"conta" | "geracao">("conta");
  const [valorInput, setValorInput] = useState("");
  const [tarifaCustom, setTarifaCustom] = useState("");
  const [taxaCompra, setTaxaCompra] = useState("");
  const [prazoContrato, setPrazoContrato] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [estruturaSolo, setEstruturaSolo] = useState(false);
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  
  const [resultado, setResultado] = useState<SimulacaoResult | null>(null);
  const [calculosInvestimento, setCalculosInvestimento] = useState<{
    investimentoTotal: number;
    geracaoMensal: number;
    receitaMensal: number;
    receitaAnual: number;
    receitaTotal: number;
    roi: number;
    payback: number;
    tarifaVendaGC: number;
    economiaClienteGC: number;
    tabelaProjecao: Array<{ ano: number; receitaAnual: number; receitaAcumulada: number; taxaCompra: number }>;
  } | null>(null);

  const handleCalcular = () => {
    const valor = parseFloat(valorInput);
    if (!valor || valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    const taxaCompraNum = parseFloat(taxaCompra);
    if (!taxaCompraNum || taxaCompraNum <= 0) {
      toast.error("Informe a taxa de compra de energia");
      return;
    }

    const prazoNum = parseInt(prazoContrato);
    if (!prazoNum || prazoNum <= 0) {
      toast.error("Informe o prazo do contrato");
      return;
    }

    const clienteObj = clientes.find((c) => c.id === clienteSelecionado);

    const simulacao = executarSimulacao(
      {
        valorConta: modoCalculo === "conta" ? valor : undefined,
        geracaoAlvo: modoCalculo === "geracao" ? valor : undefined,
        modoCalculo,
        tarifaCustom: tarifaCustom ? parseFloat(tarifaCustom) : undefined,
        estruturaSolo,
        clienteId: clienteObj?.id,
        clienteNome: clienteObj?.nome,
        vendedor: "Vendedor Atual",
      },
      parametros,
      equipamentos
    );

    if (!simulacao) {
      toast.error("Erro ao calcular. Verifique os parâmetros.");
      return;
    }

    // Cálculos de Investimento
    const investimentoTotal = simulacao.valorTotal;
    const geracaoMensal = simulacao.geracaoReal;
    const tarifaBase = tarifaCustom ? parseFloat(tarifaCustom) : parametros?.tarifaComercial || 1.1;
    const tarifaVendaGC = tarifaBase * (1 - (parametros?.descontoVendaGC || 0.20));
    
    const receitaMensal = geracaoMensal * taxaCompraNum;
    const receitaAnual = receitaMensal * 12;

    // Calcular receita total com reajuste anual
    let receitaTotal = 0;
    const tabelaProjecao: Array<{ ano: number; receitaAnual: number; receitaAcumulada: number; taxaCompra: number }> = [];
    let taxaAjustada = taxaCompraNum;
    const reajusteMedio = parametros?.reajusteMedio || 0.08;

    for (let ano = 1; ano <= prazoNum; ano++) {
      const receitaAnoAtual = geracaoMensal * 12 * taxaAjustada;
      receitaTotal += receitaAnoAtual;
      tabelaProjecao.push({
        ano,
        receitaAnual: receitaAnoAtual,
        receitaAcumulada: receitaTotal,
        taxaCompra: taxaAjustada,
      });
      taxaAjustada *= (1 + reajusteMedio);
    }
    
    const roi = ((receitaTotal - investimentoTotal) / investimentoTotal) * 100;
    const payback = investimentoTotal / receitaAnual;
    const economiaClienteGC = geracaoMensal * (tarifaBase - tarifaVendaGC);

    setResultado(simulacao);
    setCalculosInvestimento({
      investimentoTotal,
      geracaoMensal,
      receitaMensal,
      receitaAnual,
      receitaTotal,
      roi,
      payback,
      tarifaVendaGC,
      economiaClienteGC,
      tabelaProjecao,
    });
    toast.success("Simulação calculada com sucesso!");
  };

  const handleSalvarOrcamento = () => {
    if (!resultado || !calculosInvestimento) {
      toast.error("Calcule a simulação antes de salvar");
      return;
    }

    const now = new Date();
    const numero = `ORC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    addOrcamento({
      numero,
      data: now.toISOString(),
      validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      cliente_id: resultado.clienteId || null,
      cliente_nome: resultado.clienteNome || "Cliente não informado",
      geracao_kwh: resultado.geracaoReal,
      qtd_modulos: resultado.qtdModulos,
      modelo_modulo: resultado.modeloModulo,
      potencia_modulo_w: resultado.potenciaModulo,
      inversor_kw: resultado.inversorKw,
      valor_base: resultado.valorBase,
      custo_estrutura_solo: resultado.custoEstruturaSolo || 0,
      valor_total: resultado.valorTotal,
      estrutura_solo: resultado.estruturaSolo,
      parcela_selecionada: null,
      prestacao: null,
      economia_mensal: calculosInvestimento.receitaMensal || 0,
      economia_percentual: null,
      payback_meses: calculosInvestimento.payback ? Math.round(calculosInvestimento.payback * 12) : null,
      status: "pendente"
    });

    toast.success("Orçamento de Investimento salvo com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Simulação de Investimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modo de Cálculo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={modoCalculo === "conta" ? "default" : "outline"}
                  onClick={() => setModoCalculo("conta")}
                >
                  Valor da Conta (R$)
                </Button>
                <Button
                  type="button"
                  variant={modoCalculo === "geracao" ? "default" : "outline"}
                  onClick={() => setModoCalculo("geracao")}
                >
                  Geração Alvo (kWh/mês)
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorInput">
                {modoCalculo === "conta" ? "Valor da Conta (R$)" : "Geração Alvo (kWh/mês)"} *
              </Label>
              <Input
                id="valorInput"
                type="number"
                step="0.01"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                placeholder={modoCalculo === "conta" ? "850.00" : "680"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tarifa">Tarifa de Energia (R$/kWh)</Label>
              <Input
                id="tarifa"
                type="number"
                step="0.01"
                value={tarifaCustom}
                onChange={(e) => setTarifaCustom(e.target.value)}
                placeholder={`Padrão: ${(parametros?.tarifaComercial ?? 0).toFixed(2)}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxaCompra">Taxa Compra Energia (R$/kWh)</Label>
              <Input
                id="taxaCompra"
                type="number"
                step="0.01"
                value={taxaCompra}
                onChange={(e) => setTaxaCompra(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prazoContrato">Prazo do Contrato (anos)</Label>
              <Input
                id="prazoContrato"
                type="number"
                value={prazoContrato}
                onChange={(e) => setPrazoContrato(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente (opcional)</Label>
              <div className="flex gap-2">
                <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
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
                <Button type="button" variant="outline" onClick={() => setClienteDialogOpen(true)}>
                  Novo
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="estruturaSolo" checked={estruturaSolo} onCheckedChange={(c) => setEstruturaSolo(c as boolean)} />
            <Label htmlFor="estruturaSolo" className="cursor-pointer">
              Estrutura de Solo (+R$ {(parametros?.adicionalEstrutSoloPorPlaca ?? 0).toFixed(2)}/placa)
            </Label>
          </div>
          <Button onClick={handleCalcular} size="lg" className="w-full">
            <Calculator className="mr-2 h-5 w-5" />
            Calcular Investimento
          </Button>
        </CardContent>
      </Card>

      {/* Resultados do Sistema */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Sistema Fotovoltaico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Geração Mensal</p>
                <p className="text-2xl font-bold">{resultado.geracaoReal} kWh</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Sistema</p>
                <p className="text-2xl font-bold">
                  {resultado.qtdModulos} × {resultado.potenciaModulo}W
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Inversor</p>
                <p className="text-2xl font-bold">{resultado.inversorKw} kW</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Potência Total</p>
                <p className="text-2xl font-bold">{((resultado.qtdModulos * resultado.potenciaModulo) / 1000).toFixed(2)} kWp</p>
              </div>
            </div>
            {resultado.estruturaSolo && (
              <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-sm">
                  <strong>Estrutura de Solo:</strong> +{formatarMoeda(resultado.custoEstruturaSolo)}
                </p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <p className="text-lg">
                <strong>Investimento Total:</strong> <span className="text-3xl font-bold text-primary">{formatarMoeda(resultado.valorTotal)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cálculos de Investimento */}
      {calculosInvestimento && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Retorno sobre Investimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Receita Mensal</p>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(calculosInvestimento.receitaMensal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Receita Anual</p>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(calculosInvestimento.receitaAnual)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ROI ({prazoContrato} anos)</p>
                  <p className="text-2xl font-bold text-primary">{formatarPorcentagem(calculosInvestimento.roi)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Payback</p>
                  <p className="text-2xl font-bold">{calculosInvestimento.payback.toFixed(1)} anos</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-lg font-semibold">
                  Receita Total em {prazoContrato} anos: <span className="text-2xl text-green-600">{formatarMoeda(calculosInvestimento.receitaTotal)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projeção de Receitas ({prazoContrato} anos)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={calculosInvestimento.tabelaProjecao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ano" label={{ value: "Ano", position: "insideBottom", offset: -5 }} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatarMoeda(Number(value))} />
                  <ReferenceLine y={calculosInvestimento.investimentoTotal} stroke="red" strokeDasharray="3 3" label="Investimento" />
                  <Line type="monotone" dataKey="receitaAcumulada" stroke="hsl(var(--primary))" strokeWidth={3} name="Receita Acumulada" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Tabela de Projeção Anual</p>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Ano</th>
                        <th className="p-2 text-right">Taxa Compra</th>
                        <th className="p-2 text-right">Receita Anual</th>
                        <th className="p-2 text-right">Receita Acumulada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculosInvestimento.tabelaProjecao.map((item) => (
                        <tr key={item.ano} className="border-t">
                          <td className="p-2">Ano {item.ano}</td>
                          <td className="p-2 text-right">R$ {item.taxaCompra.toFixed(4)}/kWh</td>
                          <td className="p-2 text-right">{formatarMoeda(item.receitaAnual)}</td>
                          <td className="p-2 text-right font-semibold">{formatarMoeda(item.receitaAcumulada)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenda na Geração Compartilhada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tarifa Distribuidora</p>
                  <p className="text-xl font-bold">
                    {formatarMoeda(tarifaCustom ? parseFloat(tarifaCustom) : parametros?.tarifaComercial)}/kWh
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tarifa Moreira (20% desconto)</p>
                  <p className="text-xl font-bold text-green-600">{formatarMoeda(calculosInvestimento.tarifaVendaGC)}/kWh</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Economia para Cliente</p>
                  <p className="text-xl font-bold text-green-600">{formatarMoeda(calculosInvestimento.economiaClienteGC)}/mês</p>
                </div>
              </div>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm">
                  <strong>Vantagem competitiva:</strong> Cliente economiza{" "}
                  <strong>{formatarPorcentagem((parametros?.descontoVendaGC ?? 0) * 100)}</strong> comparado à distribuidora, pagando apenas{" "}
                  <strong>{formatarMoeda(calculosInvestimento.tarifaVendaGC)}</strong> por kWh.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSalvarOrcamento} className="flex-1">
              <DollarSign className="mr-2 h-4 w-4" />
              Salvar Orçamento
            </Button>
            <Button variant="outline" className="flex-1">
              Exportar PDF
            </Button>
            <Button variant="outline" className="flex-1">
              Enviar WhatsApp
            </Button>
          </div>
        </>
      )}

      <ClienteDialog
        open={clienteDialogOpen}
        onOpenChange={setClienteDialogOpen}
        onClienteCreated={(id) => setClienteSelecionado(id)}
      />
    </div>
  );
}
