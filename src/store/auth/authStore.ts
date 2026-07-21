import { create } from 'zustand';
import * as authService from '@/services/auth/auth.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { AppUser, Credentials } from '@/types/auth/auth.types';

interface AuthState {
  readonly user: AppUser | null;
  readonly status: AsyncStatus;
  readonly signingIn: boolean;
  readonly error: string | null;
  readonly initialise: () => Promise<void>;
  readonly signIn: (credentials: Credentials) => Promise<void>;
  readonly signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  signingIn: false,
  error: null,

  initialise: async () => {
    set({ status: 'loading' });
    try {
      set({ user: await authService.getCurrentUser(), status: 'success', error: null });
    } catch (error) {
      set({ user: null, status: 'error', error: getErrorMessage(error) });
    }
  },

  signIn: async (credentials) => {
    set({ signingIn: true, error: null });
    try {
      await authService.signIn(credentials);
      const user = await authService.getCurrentUser();

      if (!user) {
        // Credentials were valid but the account is deactivated.
        await authService.signOut();
        throw new Error('Your account is not active. Contact an administrator.');
      }

      set({ user, status: 'success' });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to sign in.') });
      throw error;
    } finally {
      set({ signingIn: false });
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, status: 'success', error: null });
  },
}));
