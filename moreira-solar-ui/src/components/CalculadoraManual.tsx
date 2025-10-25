import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEquipamentos } from "@/hooks/useEquipamentos";
import { useParametros } from "@/hooks/useParametros";
import { useClientes } from "@/hooks/useClientes";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { ClienteDialog } from "@/components/ClienteDialog";
import { 
  calcularPaybackEmMeses, 
  calculateTotalSaving, 
  formatarMoeda, 
  formatarPorcentagem 
} from "@/lib/calculadoraSolar";
import { toast } from "sonner";
import { Calculator, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ResultadoManual {
  clienteId?: string;
  clienteNome?: string;
  valorConta: number;
  qtdParcelas: number;
  valorParcela: number;
  qtdModulos: number;
  potenciaModulo: number;
  inversorKw: number;
  geracaoReal: number;
  valorEstruturaPorPlaca: number;
  taxaJuros: number;
  reajusteMedio: number;
  observacoes: string;
  // Calculados
  tarifaInferida: number;
  contaBase: number;
  custoEstruturaSolo: number;
  valorFinanciado: number;
  valorTotal: number;
  economiaMensal: number;
  economiaPercentual: number;
  paybackMeses: number;
  paybackAnos: number;
  savingTotal: number;
  economiaTotal30Anos: number;
  tabelaEconomia: Array<{ ano: number; economia: number; acumulado: number }>;
}

export default function CalculadoraManual() {
  const { equipamentos } = useEquipamentos();
  const { parametros } = useParametros();
  const { clientes } = useClientes();
  const { addOrcamento } = useOrcamentos();
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);

  // Inputs editáveis
  const [valorConta, setValorConta] = useState("");
  const [qtdParcelas, setQtdParcelas] = useState("");
  const [valorParcela, setValorParcela] = useState("");
  const [qtdModulos, setQtdModulos] = useState("");
  const [potenciaModulo, setPotenciaModulo] = useState("");
  const [estruturaPorPlaca, setEstruturaPorPlaca] = useState("");
  const [inversorKw, setInversorKw] = useState("");
  const [geracaoReal, setGeracaoReal] = useState("");
  const [taxaJuros, setTaxaJuros] = useState("");
  const [reajusteMedio, setReajusteMedio] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [resultado, setResultado] = useState<ResultadoManual | null>(null);

  const modulosAtivos = equipamentos.filter((e) => e.tipo === "modulo" && e.ativo);

  const handleCalcular = () => {
    // Validações básicas
    const vConta = parseFloat(valorConta);
    const nParcelas = parseInt(qtdParcelas);
    const vParcela = parseFloat(valorParcela);
    const nModulos = parseInt(qtdModulos);
    const potW = parseFloat(potenciaModulo);
    const invKw = parseFloat(inversorKw);
    const geracaoKwh = parseFloat(geracaoReal);

    if (!vConta || vConta <= 0) {
      toast.error("Informe o valor da conta");
      return;
    }
    if (!nParcelas || nParcelas <= 0) {
      toast.error("Informe a quantidade de parcelas");
      return;
    }
    if (!vParcela || vParcela <= 0) {
      toast.error("Informe o valor da parcela");
      return;
    }
    if (!nModulos || nModulos <= 0) {
      toast.error("Informe a quantidade de módulos");
      return;
    }
    if (!potW || potW <= 0) {
      toast.error("Informe a potência do módulo");
      return;
    }
    if (!invKw || invKw <= 0) {
      toast.error("Informe o inversor");
      return;
    }
    if (!geracaoKwh || geracaoKwh <= 0) {
      toast.error("Informe a geração real");
      return;
    }

    const clienteObj = clientes.find((c) => c.id === clienteSelecionado);

    // Valores com fallback para parâmetros
    const estrutPorPlaca = parseFloat(estruturaPorPlaca) || 0;
    const jMes = parseFloat(taxaJuros) || parametros?.taxaJurosMes || 0.02;
    const reajAno = parseFloat(reajusteMedio) || parametros?.reajusteMedio || 0.08;

    // 1. Tarifa inferida
    const tarifaInf = geracaoKwh > 0 && vConta > 0
      ? vConta / geracaoKwh
      : parametros?.tarifaComercial || 1.1;

    // 2. Conta base
    const contaBase = geracaoKwh > 0 ? geracaoKwh * tarifaInf : vConta;

    // 3. Custo estrutura de solo
    const custoEstrutSolo = nModulos > 0 && estrutPorPlaca > 0 
      ? nModulos * estrutPorPlaca 
      : 0;

    // 4. Valor financiado
    const valorFin = nParcelas * vParcela;

    // 5. Valor total
    const valorTotal = valorFin + custoEstrutSolo;

    // 6. Economia mensal (mês 1)
    const econMensal = Math.max(0, contaBase - vParcela);

    // 7. Percentual
    const econPct = contaBase > 0 ? Math.max(0, 1 - vParcela / contaBase) : 0;

    // 8. Economia bruta 30 anos
    let acumulado = 0;
    const tabelaEcon: Array<{ ano: number; economia: number; acumulado: number }> = [];
    for (let ano = 1; ano <= 30; ano++) {
      const econAno = contaBase * 12 * Math.pow(1 + reajAno, ano - 1);
      acumulado += econAno;
      tabelaEcon.push({ ano, economia: econAno, acumulado });
    }

    // 9. Saving durante parcelamento
    const anosParcelas = Math.ceil(nParcelas / 12);
    const savTotal = calculateTotalSaving(
      geracaoKwh,
      tarifaInf,
      reajAno,
      vParcela,
      anosParcelas
    );

    // 10. Payback
    const payMeses = calcularPaybackEmMeses(contaBase, reajAno, nParcelas, vParcela);
    const payAnos = Math.ceil(payMeses / 12);

    const res: ResultadoManual = {
      clienteId: clienteObj?.id,
      clienteNome: clienteObj?.nome,
      valorConta: vConta,
      qtdParcelas: nParcelas,
      valorParcela: vParcela,
      qtdModulos: nModulos,
      potenciaModulo: potW,
      inversorKw: invKw,
      geracaoReal: geracaoKwh,
      valorEstruturaPorPlaca: estrutPorPlaca,
      taxaJuros: jMes,
      reajusteMedio: reajAno,
      observacoes,
      tarifaInferida: tarifaInf,
      contaBase,
      custoEstruturaSolo: custoEstrutSolo,
      valorFinanciado: valorFin,
      valorTotal,
      economiaMensal: econMensal,
      economiaPercentual: econPct,
      paybackMeses: payMeses,
      paybackAnos: payAnos,
      savingTotal: savTotal,
      economiaTotal30Anos: acumulado,
      tabelaEconomia: tabelaEcon,
    };

    setResultado(res);
    toast.success("Proposta calculada com sucesso!");
  };

  const handleSalvarOrcamento = () => {
    if (!resultado) {
      toast.error("Calcule a proposta antes de salvar");
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
      modelo_modulo: `Módulo ${resultado.potenciaModulo}W`,
      potencia_modulo_w: resultado.potenciaModulo,
      inversor_kw: resultado.inversorKw,
      valor_base: resultado.valorFinanciado,
      custo_estrutura_solo: resultado.custoEstruturaSolo || 0,
      valor_total: resultado.valorTotal,
      estrutura_solo: resultado.custoEstruturaSolo > 0,
      parcela_selecionada: null,
      prestacao: null,
      economia_mensal: null,
      economia_percentual: null,
      payback_meses: null,
      status: "pendente"
    });

    toast.success("Orçamento salvo com sucesso!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proposta Manual - Inputs Customizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clienteManual">Cliente</Label>
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

            <div className="space-y-2">
              <Label htmlFor="valorContaManual">Valor da Conta (R$/mês) *</Label>
              <Input
                id="valorContaManual"
                type="number"
                step="0.01"
                value={valorConta}
                onChange={(e) => setValorConta(e.target.value)}
                placeholder="850.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qtdParcelasManual">Quantidade de Parcelas *</Label>
              <Input
                id="qtdParcelasManual"
                type="number"
                value={qtdParcelas}
                onChange={(e) => setQtdParcelas(e.target.value)}
                placeholder="60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorParcelaManual">Valor da Parcela (R$) *</Label>
              <Input
                id="valorParcelaManual"
                type="number"
                step="0.01"
                value={valorParcela}
                onChange={(e) => setValorParcela(e.target.value)}
                placeholder="450.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qtdModulosManual">Quantidade de Módulos *</Label>
              <Input
                id="qtdModulosManual"
                type="number"
                value={qtdModulos}
                onChange={(e) => setQtdModulos(e.target.value)}
                placeholder="12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="potenciaManual">Potência por Módulo (W) *</Label>
              <Select value={potenciaModulo} onValueChange={setPotenciaModulo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar módulo..." />
                </SelectTrigger>
                <SelectContent>
                  {modulosAtivos.map((m) => (
                    <SelectItem key={m.id} value={m.potenciaW?.toString() || ""}>
                      {m.nome} - {m.potenciaW}W
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estruturaManual">
                Estrutura de Solo (R$/placa)
                <span className="text-xs text-muted-foreground ml-2">Opcional</span>
              </Label>
              <Input
                id="estruturaManual"
                type="number"
                step="0.01"
                value={estruturaPorPlaca}
                onChange={(e) => setEstruturaPorPlaca(e.target.value)}
                placeholder="250.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inversorManual">Inversor (kW) *</Label>
              <Input
                id="inversorManual"
                type="number"
                step="0.1"
                value={inversorKw}
                onChange={(e) => setInversorKw(e.target.value)}
                placeholder="5.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="geracaoManual">Geração Real (kWh/mês) *</Label>
              <Input
                id="geracaoManual"
                type="number"
                step="0.01"
                value={geracaoReal}
                onChange={(e) => setGeracaoReal(e.target.value)}
                placeholder="680"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxaJurosManual">
                Taxa de Juros (% a.m.)
                <span className="text-xs text-muted-foreground ml-2">
                  Padrão: {((parametros?.taxaJurosMes || 0.02) * 100).toFixed(2)}%
                </span>
              </Label>
              <Input
                id="taxaJurosManual"
                type="number"
                step="0.01"
                value={taxaJuros}
                onChange={(e) => setTaxaJuros(e.target.value)}
                placeholder={((parametros?.taxaJurosMes || 0.02) * 100).toFixed(2)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reajusteManual">
                Reajuste Médio (% a.a.)
                <span className="text-xs text-muted-foreground ml-2">
                  Padrão: {((parametros?.reajusteMedio || 0.08) * 100).toFixed(2)}%
                </span>
              </Label>
              <Input
                id="reajusteManual"
                type="number"
                step="0.01"
                value={reajusteMedio}
                onChange={(e) => setReajusteMedio(e.target.value)}
                placeholder={((parametros?.reajusteMedio || 0.08) * 100).toFixed(2)}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="observacoesManual">Observações</Label>
              <Textarea
                id="observacoesManual"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais sobre a proposta..."
                rows={3}
              />
            </div>
          </div>

          <Button onClick={handleCalcular} size="lg" className="w-full mt-6">
            <Calculator className="mr-2 h-5 w-5" />
            Calcular Proposta
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {resultado && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sistema Financiado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatarMoeda(resultado.valorFinanciado)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {resultado.qtdParcelas}x de {formatarMoeda(resultado.valorParcela)}
                </p>
              </CardContent>
            </Card>

            {resultado.custoEstruturaSolo > 0 && (
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Estrutura de Solo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    +{formatarMoeda(resultado.custoEstruturaSolo)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resultado.qtdModulos} × {formatarMoeda(resultado.valorEstruturaPorPlaca)}/placa
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-primary">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{formatarMoeda(resultado.valorTotal)}</p>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Economia Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatarMoeda(resultado.economiaMensal)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatarPorcentagem(resultado.economiaPercentual)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Análise Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Payback</p>
                  <p className="text-2xl font-bold">
                    {resultado.paybackMeses} meses ({resultado.paybackAnos} anos)
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ganhos Durante Parcelas</p>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(resultado.savingTotal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Economia 30 Anos</p>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(resultado.economiaTotal30Anos)}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">Economia Anual</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resultado.tabelaEconomia.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ano" label={{ value: "Ano", position: "insideBottom", offset: -5 }} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatarMoeda(Number(value))} />
                    <Bar dataKey="economia" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex gap-2 mt-6">
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
            </CardContent>
          </Card>
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
