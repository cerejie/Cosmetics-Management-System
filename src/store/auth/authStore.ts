import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '@/services/auth/auth.service';
import { getErrorMessage } from '@/api/common/apiError';
import { setUnauthorisedHandler } from '@/api/common/supabaseClient';
import type { AsyncStatus } from '@/types/common/api.types';
import type { AppUser, Credentials, SessionKind } from '@/types/auth/auth.types';
import type { RegisterValues } from '@/schemas/auth/register.schema';

interface AuthState {
  readonly kind: SessionKind | null;
  readonly user: AppUser | null;
  /** Custom sessions only. The superadmin's session belongs to supabase-js. */
  readonly token: string | null;
  readonly status: AsyncStatus;
  readonly signingIn: boolean;
  readonly error: string | null;
  /** True once a sign-up succeeds, so the form can show the pending notice. */
  readonly registered: boolean;
  readonly initialise: () => Promise<void>;
  readonly signIn: (credentials: Credentials) => Promise<void>;
  readonly register: (values: RegisterValues) => Promise<void>;
  readonly resetRegistration: () => void;
  readonly signOut: () => Promise<void>;
}

const CLEARED = { kind: null, user: null, token: null } as const;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...CLEARED,
      status: 'idle',
      signingIn: false,
      error: null,
      registered: false,

      initialise: async () => {
        set({ status: 'loading' });

        try {
          const { kind, user } = get();

          // A custom token cannot be refreshed and carries a stale copy of the
          // account, so the row is re-read: that catches both expiry (the
          // request 401s) and an account disabled since the token was issued.
          if (kind === 'custom' && user) {
            const current = await authService.refreshCustomUser(user.id);
            set(
              current
                ? { user: current, status: 'success', error: null }
                : { ...CLEARED, status: 'success', error: null },
            );
            return;
          }

          const superadmin = await authService.getSuperadminUser();
          set(
            superadmin
              ? { kind: 'superadmin', user: superadmin, token: null, status: 'success', error: null }
              : { ...CLEARED, status: 'success', error: null },
          );
        } catch (error) {
          set({ ...CLEARED, status: 'error', error: getErrorMessage(error) });
        }
      },

      signIn: async (credentials) => {
        set({ signingIn: true, error: null });
        try {
          const session = await authService.signIn(credentials);
          set({ ...session, status: 'success' });
        } catch (error) {
          set({ error: getErrorMessage(error, 'Unable to sign in.') });
          throw error;
        } finally {
          set({ signingIn: false });
        }
      },

      register: async ({ username, password, fullName }) => {
        set({ signingIn: true, error: null });
        try {
          await authService.register(username, password, fullName);
          set({ registered: true });
        } catch (error) {
          set({ error: getErrorMessage(error, 'Unable to create the account.') });
          throw error;
        } finally {
          set({ signingIn: false });
        }
      },

      resetRegistration: () => set({ registered: false, error: null }),

      signOut: async () => {
        // Local first, so the redirect is instant and works offline.
        set({ ...CLEARED, status: 'success', error: null });
        await authService.signOut();
      },
    }),
    {
      name: 'cosmetics-auth',
      // The superadmin's session is persisted by supabase-js; storing it again
      // here would let the two disagree after a sign-out.
      partialize: (state) => ({ kind: state.kind, user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.kind === 'custom') {
          authService.restoreCustomToken(state.token);
        }
      },
    },
  ),
);

// An expired custom token cannot be renewed, so any 401 ends the session rather
// than leaving the app failing every request.
setUnauthorisedHandler(() => {
  if (useAuthStore.getState().kind === 'custom') {
    void useAuthStore.getState().signOut();
  }
});
