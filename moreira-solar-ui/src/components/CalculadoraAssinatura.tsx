import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEquipamentos } from "@/hooks/useEquipamentos";
import { useParametros } from "@/hooks/useParametros";
import { useClientes } from "@/hooks/useClientes";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { ClienteDialog } from "@/components/ClienteDialog";
import { formatarMoeda, formatarPorcentagem } from "@/lib/calculadoraSolar";
import { toast } from "sonner";
import { Calculator, DollarSign, Zap, TrendingDown } from "lucide-react";

interface ProjecaoAssinatura {
  ano: number;
  tarifaReajustada: number;
  vendaReajustada: number;
  gastoAnualAtual: number;
  gastoAnualAssinatura: number;
  economiaAno: number;
  acumulado: number;
}

interface ResultadoAssinatura {
  clienteId?: string;
  clienteNome?: string;
  modoCalculo: "conta" | "consumo";
  valorInput: number;
  tarifaComercial: number;
  tarifaVenda: number;
  consumoMensal: number;
  gastoMensalAtual: number;
  gastoMensalAssinatura: number;
  economiaMensal: number;
  economiaAnual: number;
  percentualEconomia: number;
  economiaTotal15Anos: number;
  projecao: ProjecaoAssinatura[];
}

export default function CalculadoraAssinatura() {
  const { equipamentos } = useEquipamentos();
  const { parametros } = useParametros();
  const { clientes } = useClientes();
  const { addOrcamento } = useOrcamentos();
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [modoCalculo, setModoCalculo] = useState<"conta" | "consumo">("conta");
  const [valorInput, setValorInput] = useState("");
  const [tarifaComercialInput, setTarifaComercialInput] = useState("");
  const [tarifaVendaInput, setTarifaVendaInput] = useState("");

  const [resultado, setResultado] = useState<ResultadoAssinatura | null>(null);

  const handleCalcular = () => {
    const valor = parseFloat(valorInput);
    if (!valor || valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    const clienteObj = clientes.find((c) => c.id === clienteSelecionado);

    // 1. Obter tarifa comercial
    let tarifaComercial: number;
    const tarifaInformada = parseFloat(tarifaComercialInput);
    
    if (tarifaInformada > 0) {
      tarifaComercial = tarifaInformada;
    } else {
      // Calcular de componentes (se disponíveis)
      const { tusd, te, pisConfins, icms } = parametros;
      const denominador = (1 - (pisConfins || 0)) * (1 - (icms || 0));
      tarifaComercial = denominador > 0 && tusd && te
        ? (tusd + te) / denominador
        : parametros?.tarifaComercial || 1.1;
    }

    // 2. Obter tarifa de venda (padrão: 80% da comercial = 20% desconto)
    const tarifaVendaInf = parseFloat(tarifaVendaInput);
    const tarifaVenda = tarifaVendaInf > 0 
      ? tarifaVendaInf 
      : tarifaComercial * 0.80;

    // 3. Determinar consumo mensal
    const consumoMensal = modoCalculo === "conta"
      ? valor / tarifaComercial
      : valor;

    // 4. Cálculo de economia
    const gastoMensalAtual = consumoMensal * tarifaComercial;
    const gastoMensalAssinatura = consumoMensal * tarifaVenda;
    const economiaMensal = gastoMensalAtual - gastoMensalAssinatura;
    const economiaAnual = economiaMensal * 12;
    const percentualEconomia = gastoMensalAtual > 0 
      ? ((gastoMensalAtual - gastoMensalAssinatura) / gastoMensalAtual) 
      : 0;

    // 5. Projeção 15 anos com reajuste
    const anos = 15;
    const reajuste = parametros?.reajusteMedio || 0.08;
    let acumulado = 0;
    const projecao: ProjecaoAssinatura[] = [];

    for (let i = 0; i < anos; i++) {
      const ano = i + 1;
      const fator = Math.pow(1 + reajuste, i);
      
      const tarifaReajustada = tarifaComercial * fator;
      const vendaReajustada = tarifaVenda * fator;
      
      const gastoAnualAtual = consumoMensal * 12 * tarifaReajustada;
      const gastoAnualAssinatura = consumoMensal * 12 * vendaReajustada;
      const economiaAno = gastoAnualAtual - gastoAnualAssinatura;
      
      acumulado += economiaAno;
      
      projecao.push({
        ano,
        tarifaReajustada,
        vendaReajustada,
        gastoAnualAtual,
        gastoAnualAssinatura,
        economiaAno,
        acumulado
      });
    }

    const res: ResultadoAssinatura = {
      clienteId: clienteObj?.id,
      clienteNome: clienteObj?.nome,
      modoCalculo,
      valorInput: valor,
      tarifaComercial,
      tarifaVenda,
      consumoMensal,
      gastoMensalAtual,
      gastoMensalAssinatura,
      economiaMensal,
      economiaAnual,
      percentualEconomia,
      economiaTotal15Anos: acumulado,
      projecao
    };

    setResultado(res);
    toast.success("Simulação de assinatura calculada!");
  };

  const handleSalvarOrcamento = () => {
    if (!resultado) {
      toast.error("Calcule a simulação antes de salvar");
      return;
    }

    addOrcamento({
      cliente: resultado.clienteNome || "Cliente não informado",
      conta: resultado.gastoMensalAtual,
      consumo: resultado.consumoMensal,
      kwp: 0,
      placas: 0,
      modeloPlaca: "Assinatura",
      inversor: "N/A",
      tipoTelhado: "N/A",
      fase: "N/A",
      estruturaSolo: false,
      total: resultado.gastoMensalAssinatura * 12,
      status: "Rascunho",
      validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      dono: "Vendedor Atual",
      precoBase: resultado.gastoMensalAssinatura * 12,
      maoDeObra: 0,
      frete: 0,
      adicionais: 0,
      desconto: 0,
      markup: 1,
      origem: "assinatura",
      tipoCalculadora: "assinatura",
      tarifaVenda: resultado.tarifaVenda,
      economiaTotal15Anos: resultado.economiaTotal15Anos,
    });

    toast.success("Orçamento de assinatura salvo!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Geração Compartilhada - Assinatura de Energia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clienteAssinatura">Cliente</Label>
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
              <Label>Modo de Cálculo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={modoCalculo === "conta" ? "default" : "outline"}
                  onClick={() => setModoCalculo("conta")}
                  className="flex-1"
                >
                  Valor da Conta (R$)
                </Button>
                <Button
                  type="button"
                  variant={modoCalculo === "consumo" ? "default" : "outline"}
                  onClick={() => setModoCalculo("consumo")}
                  className="flex-1"
                >
                  Consumo (kWh/mês)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorAssinatura">
                {modoCalculo === "conta" ? "Valor da Conta (R$)" : "Consumo (kWh/mês)"} *
              </Label>
              <Input
                id="valorAssinatura"
                type="number"
                step="0.01"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                placeholder={modoCalculo === "conta" ? "850.00" : "680"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tarifaComAssinatura">
                Tarifa Comercial (R$/kWh)
                <span className="text-xs text-muted-foreground ml-2">
                  Padrão: {(parametros?.tarifaComercial || 1.1).toFixed(3)}
                </span>
              </Label>
              <Input
                id="tarifaComAssinatura"
                type="number"
                step="0.001"
                value={tarifaComercialInput}
                onChange={(e) => setTarifaComercialInput(e.target.value)}
                placeholder={(parametros?.tarifaComercial || 1.1).toFixed(3)}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="tarifaVendaAssinatura">
                Tarifa de Venda (R$/kWh)
                <span className="text-xs text-muted-foreground ml-2">
                  Padrão: 80% da comercial (20% desconto)
                </span>
              </Label>
              <Input
                id="tarifaVendaAssinatura"
                type="number"
                step="0.001"
                value={tarifaVendaInput}
                onChange={(e) => setTarifaVendaInput(e.target.value)}
                placeholder={((parametros?.tarifaComercial || 1.1) * 0.8).toFixed(3)}
              />
            </div>
          </div>

          <Button onClick={handleCalcular} size="lg" className="w-full mt-6">
            <Calculator className="mr-2 h-5 w-5" />
            Calcular Economia
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {resultado && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Consumo Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{resultado.consumoMensal.toFixed(0)} kWh</p>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-green-500/5 md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Economia com Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-700 dark:text-green-400">
                  {formatarPorcentagem(resultado.percentualEconomia)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                  Custo Energisa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {formatarMoeda(resultado.gastoMensalAtual)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {resultado.tarifaComercial.toFixed(3)} R$/kWh
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Valor Moreira Solar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {formatarMoeda(resultado.gastoMensalAssinatura)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {resultado.tarifaVenda.toFixed(3)} R$/kWh
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                  Economia Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatarMoeda(resultado.economiaMensal)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-600/30 bg-green-600/5 md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">
                  Economia Anual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                  {formatarMoeda(resultado.economiaAnual)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Projeção de Economia - 15 Anos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Economia Total em 15 Anos</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {formatarMoeda(resultado.economiaTotal15Anos)}
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Sem Assinatura</TableHead>
                      <TableHead className="text-right">Com Assinatura</TableHead>
                      <TableHead className="text-right">Economia Anual</TableHead>
                      <TableHead className="text-right">Economia Acumulada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.projecao.map((p) => (
                      <TableRow key={p.ano}>
                        <TableCell className="font-medium">{p.ano}º ano</TableCell>
                        <TableCell className="text-right text-red-700 dark:text-red-400">
                          {formatarMoeda(p.gastoAnualAtual)}
                        </TableCell>
                        <TableCell className="text-right text-blue-700 dark:text-blue-400">
                          {formatarMoeda(p.gastoAnualAssinatura)}
                        </TableCell>
                        <TableCell className="text-right text-green-700 dark:text-green-400 font-semibold">
                          {formatarMoeda(p.economiaAno)}
                        </TableCell>
                        <TableCell className="text-right text-green-800 dark:text-green-300 font-bold">
                          {formatarMoeda(p.acumulado)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
