import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export interface UserProfile {
  id: string;
  nome: string;
  email?: string | null;
  avatar?: string | null;
  perfil: 'admin' | 'gestor' | 'vendedor';
  gestor_id?: string | null;
  ativo?: boolean;
}

export function useUserProfile() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiGet<UserProfile>('/api/me');
      if (!res.ok) return null;
      return res.data as any;
    },
    staleTime: 30_000,
  });

  return {
    profile,
    isLoading
  };
}
