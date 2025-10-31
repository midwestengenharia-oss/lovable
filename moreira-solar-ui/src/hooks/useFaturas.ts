import { useQuery } from '@tanstack/react-query';
import { Fatura } from '@/types/supabase';
import { apiGet } from '@/lib/api';

export function useFaturas() {
  const { data: faturas = [], isLoading } = useQuery({
    queryKey: ['faturas'],
    queryFn: async () => {
      const res = await apiGet<Fatura[]>(`/api/faturas`);
      if (!res.ok) throw new Error('Falha ao carregar faturas');
      return res.data;
    }
  });

  return {
    faturas,
    isLoading
  };
}

/* export function useUnidadesConsumidoras() {
  const { data: unidades = [], isLoading } = useQuery({
    queryKey: ['unidades_consumidoras'],
    queryFn: async () => {
      // Mantido no front (ainda sem BFF). Migrar depois se necessário.
      const res = await fetch('/api/unidades-consumidoras', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar unidades consumidoras');
      return (await res.json()) as UnidadeConsumidora[];
    }
  });

  return {
    unidades,
    isLoading
  };
} */
