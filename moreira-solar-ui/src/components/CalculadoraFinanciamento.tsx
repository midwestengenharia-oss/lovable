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
import {
  executarSimulacao,
  calcularDetalhesParcela,
  formatarMoeda,
  formatarPorcentagem,
  SimulacaoResult,
  DetalhesParcelaResult,
} from "@/lib/calculadoraSolar";
import { gerarPDF } from '@/lib/pdf/gerarPDF';
import { toast } from "sonner";
import { Calculator, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function gerarTabelaEconomia(
  rows: { periodo: number; economiaAnual: string; economiaAcumulada: string }[]
): string {
  if (!rows || !rows.length) return "<tr><td colspan='3'>Sem dados</td></tr>";

  return rows
    .map(
      (row, index) => `
        <tr${index % 2 === 0 ? ' class="alt"' : ""}>
          <td class="col-ano">Ano ${row.periodo}</td>
          <td class="col-ea">${row.economiaAnual}</td>
          <td class="col-ac">${row.economiaAcumulada}</td>
        </tr>
      `
    )
    .join("");
}

export default function CalculadoraFinanciamento() {
  const { equipamentos } = useEquipamentos();
  const { parametros } = useParametros();
  const { clientes } = useClientes();
  const { addOrcamento } = useOrcamentos();

  const [modoCalculo, setModoCalculo] = useState<"conta" | "geracao">("conta");
  const [valorInput, setValorInput] = useState("");
  const [tarifaCustom, setTarifaCustom] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [estruturaSolo, setEstruturaSolo] = useState(false);
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);

  const [resultado, setResultado] = useState<SimulacaoResult | null>(null);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<DetalhesParcelaResult | null>(null);


  const handleCalcular = () => {
    const valor = parseFloat(valorInput);
    if (!valor || valor <= 0) {
      toast.error("Informe um valor válido");
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

    setResultado(simulacao);
    setParcelaSelecionada(null);
    setDetalhes(null);
    toast.success("Simulação calculada com sucesso!");
  };

  const handleSelecionarParcela = (parcelas: number) => {
    if (!resultado) return;

    const det = calcularDetalhesParcela(resultado, parcelas, parametros);
    setParcelaSelecionada(parcelas);
    setDetalhes(det);
  };

  const handleSalvarOrcamento = () => {
    if (!resultado || !parcelaSelecionada || !detalhes) {
      toast.error("Selecione uma opção de parcelamento antes de salvar");
      return;
    }

    const now = new Date();
    const numero = `ORC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(
      2,
      "0"
    )}${String(now.getSeconds()).padStart(2, "0")}`;

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
      parcela_selecionada: parcelaSelecionada,
      prestacao: detalhes.prestacao,
      economia_mensal: resultado.economiaMensal || 0,
      economia_percentual: resultado.economiaPercentual || 0,
      payback_meses: resultado.paybackMeses || null,
      status: "Rascunho",
    });

    toast.success("Orçamento salvo com sucesso!");
  };

  // =============== EXPORTAR PDF ===============
  const montarLinhasTabelaEconomia = (d: DetalhesParcelaResult) => {
    return d.tabelaEconomia
      .map(
        (row, i) => `
        <tr class="${i % 2 === 0 ? "alt" : ""}">
          <td class="col-ano">${row.ano}</td>
          <td class="col-ea">${formatarMoeda(row.economia)}</td>
          <td class="col-ac">${formatarMoeda(row.economiaAcumulada)}</td>
        </tr>`
      )
      .join("");
  };

  const handleExportarPDF = async () => {
    if (!resultado || !detalhes || !parcelaSelecionada) {
      toast.error("Selecione uma opção de parcelamento antes de exportar");
      return;
    }

    const dataMap: Record<string, any> = {
      'CLIENTE_NOME_AQUI': resultado.clienteNome || "Cliente não informado",
      'PARCELAS_AQUI': parcelaSelecionada.toString(),
      'VALOR_PARCELA_AQUI': formatarMoeda(detalhes.prestacao),
      'GERACAO_AQUI': resultado.geracaoReal.toString(),
      'CONTA_BASE_AQUI': formatarMoeda(resultado.valorConta || 0),
      'INVERSOR_AQUI': resultado.inversorKw.toString(),
      'QTD_MODULOS_AQUI': resultado.qtdModulos.toString(),
      'POTENCIA_MODULOS_AQUI': resultado.potenciaModulo.toString(),
      'VALOR_ESTRUTURA_SOLO_AQUI': formatarMoeda(resultado.custoEstruturaSolo || 0),
      'ECONOMIA_MENSAL_AQUI': formatarMoeda(detalhes.economiaMensal),
      'ECONOMIA_PERCENTUAL_AQUI': formatarPorcentagem(detalhes.economiaPercentual),
      'PAYBACK_MESES_AQUI': detalhes.paybackMeses.toString(),
      'PAYBACK_ANOS_AQUI': detalhes.paybackAnos.toString(),
      'GANHOS_PARCELAMENTO_AQUI': formatarMoeda(detalhes.ganhosDuranteParcelas),
      'ECONOMIA_TOTAL_AQUI': formatarMoeda(detalhes.economiaTotal30Anos),
      'VENDEDOR_NOME_AQUI': "Vendedor Atual",
      'VENDEDOR_TELEFONE_AQUI': "(66) 99999-9999",
      'TABELA_ECONOMIA_ROWS': gerarTabelaEconomia(
        detalhes.tabelaEconomia.map((row) => ({
          periodo: row.ano,
          economiaAnual: formatarMoeda(row.economia),
          economiaAcumulada: formatarMoeda(row.economiaAcumulada),
        }))
      ),
      'CLASS_ESTRUTURA_SOLO': resultado.estruturaSolo ? '' : 'hidden',
    };

    await gerarPDF('FinanciamentoTemplate', dataMap, {
      filename: `Simulacao_${resultado.clienteNome || 'cliente'}.pdf`,
      debug: false, // mude pra true se quiser ver o HTML renderizado antes do PDF
    });

    toast.success("📄 PDF gerado com sucesso!");
  };
  // ===========================================

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Simulação</CardTitle>
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
                placeholder={`Padrão: ${(parametros?.tarifaComercial || 1.1).toFixed(2)}`}
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
            <Checkbox
              id="estruturaSolo"
              checked={estruturaSolo}
              onCheckedChange={(c) => setEstruturaSolo(c as boolean)}
            />
            <Label htmlFor="estruturaSolo" className="cursor-pointer">
              Estrutura de Solo (+R$ {(parametros?.adicionalEstrutSoloPorPlaca ?? 0).toFixed(2)}/placa)
            </Label>
          </div>
          <Button onClick={handleCalcular} size="lg" className="w-full">
            <Calculator className="mr-2 h-5 w-5" />
            Calcular
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {resultado && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resultados da Simulação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Geração Real</p>
                  <p className="text-2xl font-bold">{resultado.geracaoReal} kWh/mês</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Sistema</p>
                  <p className="text-2xl font-bold">
                    {resultado.qtdModulos} × {resultado.potenciaModulo}W
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Inversor Mínimo</p>
                  <p className="text-2xl font-bold">{resultado.inversorKw} kW</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Valor Base</p>
                  <p className="text-2xl font-bold">{formatarMoeda(resultado.valorBase)}</p>
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
                  <strong>Total do Sistema:</strong>{" "}
                  <span className="text-3xl font-bold text-primary">
                    {formatarMoeda(resultado.valorTotal)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4">Opções de Parcelamento</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {resultado.opcoesParcelamento.map((opc) => (
                <Card
                  key={opc.parcelas}
                  className={`cursor-pointer transition-all ${parcelaSelecionada === opc.parcelas ? "ring-2 ring-primary" : "hover:shadow-lg"
                    }`}
                  onClick={() => handleSelecionarParcela(opc.parcelas)}
                >
                  <CardContent className="pt-6 text-center">
                    <p className="text-4xl font-bold">{opc.parcelas}x</p>
                    <p className="text-sm text-muted-foreground mt-2">de</p>
                    <p className="text-2xl font-bold text-primary">{formatarMoeda(opc.prestacao)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Detalhes da Parcela */}
      {detalhes && parcelaSelecionada && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Parcelamento em {parcelaSelecionada}x</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Parcela Mensal</p>
                  <p className="text-2xl font-bold">{formatarMoeda(detalhes.prestacao)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Economia Mensal</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatarMoeda(detalhes.economiaMensal)} ({formatarPorcentagem(detalhes.economiaPercentual)})
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Payback</p>
                  <p className="text-2xl font-bold">
                    {detalhes.paybackMeses} meses ({detalhes.paybackAnos} anos)
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ganhos Durante Parcelas</p>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(detalhes.ganhosDuranteParcelas)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Economia 30 Anos</p>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(detalhes.economiaTotal30Anos)}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">Economia Anual</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={detalhes.tabelaEconomia.slice(0, 10)}>
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
                <Button variant="outline" className="flex-1" onClick={handleExportarPDF}>
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

