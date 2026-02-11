import { Parametros, Equipamento, Simulacao } from "@/contexts/AppContext";

// Funções financeiras base (do js_moreira.js)
export function calcularValorFinanciadoBase(parcela: number, j: number, n: number): number {
  if (!isFinite(parcela) || parcela <= 0 || !isFinite(n) || n <= 0) return 0;
  if (!isFinite(j) || j < 0) j = 0;
  if (j === 0) return parcela * n;
  return parcela * ((1 - Math.pow(1 + j, -n)) / j);
}

export function calcularPrestacao(valorFin: number, j: number, n: number): number {
  if (!isFinite(valorFin) || valorFin <= 0 || !isFinite(n) || n <= 0) return 0;
  if (!isFinite(j) || j < 0) j = 0;
  if (j === 0) return valorFin / n;
  return valorFin * (j / (1 - Math.pow(1 + j, -n)));
}

export function calcularPaybackEmMeses(valorConta: number, reaj: number, nParcelas: number, prest: number): number {
  if (!isFinite(valorConta) || valorConta <= 0) return nParcelas || 0;
  if (!isFinite(prest) || prest <= 0) return 0;
  if (!isFinite(reaj) || reaj < 0) reaj = 0;
  let acum = 0;
  const totalInv = (nParcelas || 0) * prest;
  for (let m = 1; m <= (nParcelas || 0); m++) {
    acum += valorConta * Math.pow(1 + reaj, Math.floor((m - 1) / 12));
    if (acum >= totalInv) return m;
  }
  return nParcelas || 0;
}

export function calculateTotalSaving(
  kWhPerMonth: number,
  initialTariff: number,
  annualIncrease: number,
  installment: number,
  years: number
): number {
  let total = 0;
  const km = isFinite(kWhPerMonth) ? kWhPerMonth : 0;
  const it = isFinite(initialTariff) ? initialTariff : 0;
  const ai = isFinite(annualIncrease) && annualIncrease > 0 ? annualIncrease : 0;
  const inst = isFinite(installment) ? installment : 0;
  const yrs = isFinite(years) ? years : 0;
  for (let n = 1; n <= yrs; n++) {
    const tariff = it * Math.pow(1 + ai, n - 1);
    total += (km * tariff - inst) * 12;
  }
  return Number(total.toFixed(2));
}

// Helpers numéricos
const truncar = (v: number, c: number) => Math.trunc((Number(v) || 0) * Math.pow(10, c)) / Math.pow(10, c);
const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const roundUp2 = (n: number) => Math.ceil(((Number(n) || 0) - 1e-10) * 100) / 100;

export interface SimulacaoInput {
  valorConta?: number;
  geracaoAlvo?: number;
  modoCalculo: "conta" | "geracao";
  tarifaCustom?: number;
  estruturaSolo: boolean;
  clienteId?: string;
  clienteNome?: string;
  vendedor: string;
}

export interface SimulacaoResult extends Omit<Simulacao, "id" | "data"> {
  opcoesParcelamento: Array<{ parcelas: number; prestacao: number }>;
}

export function executarSimulacao(
  input: SimulacaoInput,
  parametros: Parametros,
  equipamentos: Equipamento[]
): SimulacaoResult | null {
  // Validações
  if (input.modoCalculo === "conta" && (!input.valorConta || input.valorConta <= 0)) {
    return null;
  }
  if (input.modoCalculo === "geracao" && (!input.geracaoAlvo || input.geracaoAlvo <= 0)) {
    return null;
  }

  // Tarifa
  const tarifa = input.tarifaCustom || parametros.tarifaComercial;

  // Determinar geração meta
  let geracaoMeta: number;
  if (input.modoCalculo === "conta") {
    geracaoMeta = input.valorConta! / tarifa;
  } else {
    geracaoMeta = input.geracaoAlvo!;
  }

  // Buscar módulo ativo com maior potência
  const modulosAtivos = equipamentos.filter((e) => e.tipo === "modulo" && e.ativo);
  if (modulosAtivos.length === 0) {
    return null;
  }
  const moduloSelecionado = modulosAtivos.reduce((prev, curr) => 
    (curr.potenciaW || 0) > (prev.potenciaW || 0) ? curr : prev
  );
  const maxPotW = moduloSelecionado.potenciaW || 565;

  // Validações essenciais
  if (maxPotW <= 0 || parametros.geracaoKwp <= 0) {
    return null;
  }

  // Cálculos de geração (W → kWp: /1000)
  const baseUnit = (maxPotW / 1000) * parametros.geracaoKwp;
  const modules = truncar(geracaoMeta / baseUnit, 1);
  const qtdMod = Math.max(1, Math.ceil(modules));
  const geracaoReal = Math.round(qtdMod * baseUnit);
  const contaBase = geracaoReal * tarifa;

  // Valor do sistema (PV) fixado com 2% a.m. para 36 meses
  const J_REF = 0.02;
  const valorBase = calcularValorFinanciadoBase(contaBase, J_REF, 36);

  // Estrutura de Solo – custo adicional avulso (fora do financiamento)
  const custoEstrutura = input.estruturaSolo ? qtdMod * parametros.adicionalEstrutSoloPorPlaca : 0;
  const valorTotalSistema = valorBase + custoEstrutura;

  // Inversor mínimo
  const inversorMin = qtdMod * maxPotW / parametros.overLoad / 1000;

  // Opções de parcelamento com taxa dinâmica
  const opcoesParcelamento = parametros.prazos.map((n) => {
    const prestCalc = calcularPrestacao(valorBase, parametros.taxaJurosMes, n);
    const prestExib = roundUp2(prestCalc);
    return { parcelas: n, prestacao: prestExib };
  });

  return {
    clienteId: input.clienteId,
    clienteNome: input.clienteNome,
    valorConta: input.valorConta,
    geracaoAlvo: input.geracaoAlvo,
    modoCalculo: input.modoCalculo,
    tarifa,
    geracaoReal,
    qtdModulos: qtdMod,
    modeloModulo: moduloSelecionado.nome,
    potenciaModulo: maxPotW,
    inversorKw: Math.ceil(inversorMin),
    valorBase,
    custoEstruturaSolo: custoEstrutura,
    valorTotal: valorTotalSistema,
    estruturaSolo: input.estruturaSolo,
    vendedor: input.vendedor,
    status: "calculado",
    opcoesParcelamento,
  };
}

export interface DetalhesParcelaResult {
  prestacao: number;
  economiaMensal: number;
  economiaPercentual: number;
  paybackMeses: number;
  paybackAnos: number;
  economiaTotal30Anos: number;
  ganhosDuranteParcelas: number;
  tabelaEconomia: Array<{ ano: number; economia: number; acumulado: number }>;
}

export function calcularDetalhesParcela(
  simulacao: SimulacaoResult,
  parcelasSelecionadas: number,
  parametros: Parametros
): DetalhesParcelaResult {
  const opcao = simulacao.opcoesParcelamento.find((o) => o.parcelas === parcelasSelecionadas);
  if (!opcao) {
    throw new Error("Opção de parcelamento não encontrada");
  }

  const prestR = opcao.prestacao;
  const contaR = round2(simulacao.geracaoReal * simulacao.tarifa);

  // Economia mensal
  let econMensal = round2(contaR - prestR);
  if (econMensal < 0 || econMensal < 0.05) econMensal = 0;

  // Payback
  const mesesPay = calcularPaybackEmMeses(contaR, parametros.reajusteMedio, parcelasSelecionadas, prestR);
  const anoPay = Math.ceil(mesesPay / 12);

  // Tabela de economia 30 anos
  let acumulado = 0;
  const dados: Array<{ ano: number; economia: number; acumulado: number }> = [];
  for (let ano = 1; ano <= 30; ano++) {
    const econAno = contaR * 12 * Math.pow(1 + parametros.reajusteMedio, ano - 1);
    acumulado += econAno;
    dados.push({ ano, economia: econAno, acumulado });
  }

  // Ganhos durante o parcelamento
  const anosParcelas = Math.ceil(parcelasSelecionadas / 12);
  const savingTotal = calculateTotalSaving(
    simulacao.geracaoReal,
    simulacao.tarifa,
    parametros.reajusteMedio,
    prestR,
    anosParcelas
  );

  return {
    prestacao: prestR,
    economiaMensal: econMensal,
    economiaPercentual: contaR > 0 ? Math.max(0, 1 - prestR / contaR) : 0,
    paybackMeses: mesesPay,
    paybackAnos: anoPay,
    economiaTotal30Anos: acumulado,
    ganhosDuranteParcelas: savingTotal,
    tabelaEconomia: dados,
  };
}

// Formatação pt-BR
export function formatarMoeda(v: number): string {
  let n = Number.isFinite(v) ? v : 0;
  if (Math.abs(n) < 0.005) n = 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function formatarPorcentagem(v: number): string {
  let n = Number.isFinite(v) ? v : 0;
  if (Math.abs(n) < 1e-6) n = 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
