import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Parametro {
  id: string;
  chave: string;
  valor: any;
  descricao?: string;
}

export interface Parametros {
  taxaJurosMes: number;
  potenciaPorPlacaWp: number;
  adicionalEstrutSoloPorPlaca: number;
  prazos: number[];
  numeroWhatsApp: string;
  tusd: number;
  te: number;
  fioB: number;
  reajusteMedio: number;
  geracaoKwp: number;
  overLoad: number;
  pisConfins: number;
  icms: number;
  uf: string;
  tarifaComercial: number;
  taxaCompraEnergiaInvestimento: number;
  prazoContratoInvestimento: number;
  descontoVendaGC: number;
}

export function useParametros() {
  const { data: parametrosArray = [], isLoading } = useQuery({
    queryKey: ['parametros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametros')
        .select('*');

      if (error) throw error;
      return data as Parametro[];
    }
  });

  const getParametro = (chave: string, defaultValue: any = null) => {
    const param = parametrosArray.find(p => p.chave === chave);
    return param?.valor ?? defaultValue;
  };

  // Construir objeto Parametros estruturado
  const parametros: Parametros = {
    taxaJurosMes: parseFloat(getParametro('taxa_juros_mes', 0.02)),
    potenciaPorPlacaWp: parseFloat(getParametro('potencia_por_placa_wp', 565)),
    adicionalEstrutSoloPorPlaca: parseFloat(getParametro('adicional_estrut_solo_por_placa', 250)),
    prazos: getParametro('prazos', [36, 48, 60, 72, 84, 96, 108, 120]),
    numeroWhatsApp: getParametro('numero_whatsapp', ''),
    tusd: parseFloat(getParametro('tusd', 0.3)),
    te: parseFloat(getParametro('te', 0.4)),
    fioB: parseFloat(getParametro('fio_b', 0.05)),
    reajusteMedio: parseFloat(getParametro('reajuste_medio', 0.08)),
    geracaoKwp: parseFloat(getParametro('geracao_kwp', 130)),
    overLoad: parseFloat(getParametro('over_load', 1.35)),
    pisConfins: parseFloat(getParametro('pis_confins', 0.0965)),
    icms: parseFloat(getParametro('icms', 0.18)),
    uf: getParametro('uf', 'MS'),
    tarifaComercial: parseFloat(getParametro('tarifa_comercial', 1.1)),
    taxaCompraEnergiaInvestimento: parseFloat(getParametro('taxa_compra_energia_investimento', 0.65)),
    prazoContratoInvestimento: parseInt(getParametro('prazo_contrato_investimento', 15)),
    descontoVendaGC: parseFloat(getParametro('desconto_venda_gc', 0.20)),
  };

  return {
    parametros,
    parametrosArray,
    isLoading,
    getParametro
  };
}
