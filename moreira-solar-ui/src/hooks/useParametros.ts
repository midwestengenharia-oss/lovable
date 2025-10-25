import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Parametro {
  id: string;
  chave: string;
  valor: any;
  descricao?: string;
}

export function useParametros() {
  const { data: parametros = [], isLoading } = useQuery({
    queryKey: ['parametros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametros')
        .select('*');
      
      if (error) throw error;
      return data as Parametro[];
    }
  });

  const getParametro = (chave: string) => {
    const param = parametros.find(p => p.chave === chave);
    return param?.valor;
  };

  const tarifaPadrao = parseFloat(getParametro('tarifa_padrao') || '0.89');
  const hsp = parseFloat(getParametro('hsp') || '5.5');
  const taxasFinanciamento = getParametro('taxas_financiamento') || [];

  return {
    parametros,
    isLoading,
    getParametro,
    tarifaPadrao,
    hsp,
    taxasFinanciamento
  };
}
