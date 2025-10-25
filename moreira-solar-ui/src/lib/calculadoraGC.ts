import { VinculoCompensacao } from "@/contexts/AppContext";

/**
 * Calcula o valor da cobrança de Geração Compartilhada
 * @param energiaRecebida - kWh recebidos no mês
 * @param tarifaGC - R$/kWh (tarifa de venda da geradora)
 * @param descontoGC - % de desconto negociado (0-100)
 * @param valorFixo - R$ fixo negociado (opcional, substitui cálculo)
 * @returns Valor final da cobrança em R$
 */
export function calcularValorCobrancaGC(
  energiaRecebida: number,
  tarifaGC: number,
  descontoGC: number,
  valorFixo?: number
): number {
  if (valorFixo !== undefined && valorFixo > 0) {
    return valorFixo;
  }
  
  const valorBase = energiaRecebida * tarifaGC;
  const desconto = valorBase * (descontoGC / 100);
  return valorBase - desconto;
}

/**
 * Calcula a economia mensal do cliente GC
 * @param consumo - kWh consumidos no mês
 * @param energiaRecebida - kWh recebidos via GC
 * @param tarifaSemGC - R$/kWh tarifa da concessionária sem GC
 * @param valorCobrancaGC - R$ cobrado pela GC
 * @returns Economia em R$
 */
export function calcularEconomiaMensal(
  consumo: number,
  energiaRecebida: number,
  tarifaSemGC: number,
  valorCobrancaGC: number
): number {
  const valorSemGC = Math.min(consumo, energiaRecebida) * tarifaSemGC;
  return valorSemGC - valorCobrancaGC;
}

/**
 * Distribui créditos de uma geradora para suas beneficiárias
 * @param energiaDisponivel - kWh total disponível da geradora
 * @param vinculos - Vínculos de compensação (UCB + %)
 * @returns Array com UCB ID e créditos distribuídos
 */
export function calcularDistribuicaoCreditos(
  energiaDisponivel: number,
  vinculos: VinculoCompensacao[]
): Array<{ ucbId: string; creditosDistribuidos: number }> {
  return vinculos.map((v) => ({
    ucbId: v.ucbId,
    creditosDistribuidos: energiaDisponivel * (v.percentualCompensacao / 100),
  }));
}

/**
 * Valida se a soma de percentuais de uma geradora está correta
 * @param vinculos - Vínculos de compensação de uma UGI
 * @returns Objeto com validação, soma e sobra
 */
export function validarSomaPercentuais(
  vinculos: VinculoCompensacao[]
): { valido: boolean; soma: number; sobra: number } {
  const soma = vinculos.reduce((acc, v) => acc + v.percentualCompensacao, 0);
  const sobra = 100 - soma;
  
  return {
    valido: soma <= 100,
    soma,
    sobra,
  };
}

/**
 * Formata moeda brasileira
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/**
 * Formata percentual
 */
export function formatarPorcentagem(valor: number): string {
  return `${valor.toFixed(2)}%`;
}
