import { useAuthStore } from '@/store/auth/authStore';
import type { Profile } from '@/types/auth/auth.types';

interface UseAuthResult {
  readonly profile: Profile | null;
  readonly isAdmin: boolean;
  readonly isAuthenticated: boolean;
}

export const useAuth = (): UseAuthResult => {
  const profile = useAuthStore((state) => state.profile);

  return {
    profile,
    isAdmin: profile?.role === 'admin',
    isAuthenticated: profile !== null,
  };
};
