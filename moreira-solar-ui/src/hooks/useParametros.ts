import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();

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

  // Mutation para atualizar parâmetros
  const updateParametros = useMutation({
    mutationFn: async (novosParametros: Parametros) => {
      const updates = [
        { chave: 'taxa_juros_mes', valor: novosParametros.taxaJurosMes },
        { chave: 'potencia_por_placa_wp', valor: novosParametros.potenciaPorPlacaWp },
        { chave: 'adicional_estrut_solo_por_placa', valor: novosParametros.adicionalEstrutSoloPorPlaca },
        { chave: 'prazos', valor: novosParametros.prazos },
        { chave: 'numero_whatsapp', valor: novosParametros.numeroWhatsApp },
        { chave: 'tusd', valor: novosParametros.tusd },
        { chave: 'te', valor: novosParametros.te },
        { chave: 'fio_b', valor: novosParametros.fioB },
        { chave: 'reajuste_medio', valor: novosParametros.reajusteMedio },
        { chave: 'geracao_kwp', valor: novosParametros.geracaoKwp },
        { chave: 'over_load', valor: novosParametros.overLoad },
        { chave: 'pis_confins', valor: novosParametros.pisConfins },
        { chave: 'icms', valor: novosParametros.icms },
        { chave: 'uf', valor: novosParametros.uf },
        { chave: 'tarifa_comercial', valor: novosParametros.tarifaComercial },
        { chave: 'taxa_compra_energia_investimento', valor: novosParametros.taxaCompraEnergiaInvestimento },
        { chave: 'prazo_contrato_investimento', valor: novosParametros.prazoContratoInvestimento },
        { chave: 'desconto_venda_gc', valor: novosParametros.descontoVendaGC },
      ];

      // Atualizar cada parâmetro
      for (const update of updates) {
        const { error } = await supabase
          .from('parametros')
          .upsert({
            chave: update.chave,
            valor: update.valor
          }, {
            onConflict: 'chave'
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parametros'] });
      toast.success('Parâmetros atualizados com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar parâmetros:', error);
      toast.error('Erro ao atualizar parâmetros');
    }
  });

  return {
    parametros,
    parametrosArray,
    isLoading,
    getParametro,
    updateParametros: updateParametros.mutate,
    isUpdating: updateParametros.isPending
  };
}
