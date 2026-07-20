import { create } from 'zustand';
import * as authService from '@/services/auth/auth.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { Credentials, Profile } from '@/types/auth/auth.types';

interface AuthState {
  readonly profile: Profile | null;
  readonly status: AsyncStatus;
  readonly signingIn: boolean;
  readonly error: string | null;
  readonly initialise: () => Promise<void>;
  readonly signIn: (credentials: Credentials) => Promise<void>;
  readonly signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  status: 'idle',
  signingIn: false,
  error: null,

  initialise: async () => {
    set({ status: 'loading' });
    try {
      set({ profile: await authService.getCurrentProfile(), status: 'success', error: null });
    } catch (error) {
      set({ profile: null, status: 'error', error: getErrorMessage(error) });
    }
  },

  signIn: async (credentials) => {
    set({ signingIn: true, error: null });
    try {
      await authService.signIn(credentials);
      const profile = await authService.getCurrentProfile();

      if (!profile) {
        // Credentials were valid but the account is deactivated.
        await authService.signOut();
        throw new Error('Your account is not active. Contact an administrator.');
      }

      set({ profile, status: 'success' });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to sign in.') });
      throw error;
    } finally {
      set({ signingIn: false });
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ profile: null, status: 'success', error: null });
  },
}));

export const selectIsAdmin = (state: AuthState): boolean => state.profile?.role === 'admin';
