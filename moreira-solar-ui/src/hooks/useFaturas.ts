import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Fatura, UnidadeConsumidora } from '@/types/supabase';

export function useFaturas() {
  const { data: faturas = [], isLoading } = useQuery({
    queryKey: ['faturas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faturas')
        .select('*')
        .order('mes_referencia', { ascending: false });
      
      if (error) throw error;
      return data as Fatura[];
    }
  });

  return {
    faturas,
    isLoading
  };
}

export function useUnidadesConsumidoras() {
  const { data: unidades = [], isLoading } = useQuery({
    queryKey: ['unidades_consumidoras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unidades_consumidoras')
        .select('*')
        .order('numero_instalacao', { ascending: true });
      
      if (error) throw error;
      return data as UnidadeConsumidora[];
    }
  });

  return {
    unidades,
    isLoading
  };
}
