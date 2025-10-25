import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Equipamento {
  id: string;
  tipo: 'modulo' | 'inversor';
  nome: string;
  potencia_w?: number;
  valor: number;
  ativo: boolean;
}

export function useEquipamentos() {
  const { data: equipamentos = [], isLoading } = useQuery({
    queryKey: ['equipamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('ativo', true)
        .order('tipo', { ascending: true });
      
      if (error) throw error;
      return data as Equipamento[];
    }
  });

  const modulos = equipamentos.filter(e => e.tipo === 'modulo');
  const inversores = equipamentos.filter(e => e.tipo === 'inversor');

  return {
    equipamentos,
    modulos,
    inversores,
    isLoading
  };
}
