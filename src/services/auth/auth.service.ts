import * as authApi from '@/api/auth/auth.api';
import { supabase, setCustomToken } from '@/api/common/supabaseClient';
import {
  isEmailIdentifier,
  toAppUser,
  type AppUser,
  type Credentials,
  type SessionKind,
} from '@/types/auth/auth.types';

export interface Session {
  readonly kind: SessionKind;
  readonly user: AppUser;
  /** Only custom sessions carry a token; the superadmin's is owned by supabase-js. */
  readonly token: string | null;
}

/**
 * One entry point for both account types. Which one runs is decided by the
 * identifier alone: usernames cannot contain '@', so an address can only be the
 * superadmin's.
 */
export const signIn = async ({ identifier, password }: Credentials): Promise<Session> => {
  const trimmed = identifier.trim();

  if (!isEmailIdentifier(trimmed)) {
    const result = await authApi.signInWithUsername(trimmed, password);
    return { kind: 'custom', user: toAppUser(result.user), token: result.token };
  }

  await authApi.signInWithEmail(trimmed, password);

  const user = await getSuperadminUser();
  if (!user) {
    await authApi.signOut();
    throw new Error('Your account could not be loaded. Contact an administrator.');
  }

  return { kind: 'superadmin', user, token: null };
};

export const register = (username: string, password: string, fullName: string): Promise<void> =>
  authApi.register(username, password, fullName);

export const signOut = (): Promise<void> => authApi.signOut();

/** Re-installs a persisted custom token after a page reload. */
export const restoreCustomToken = (token: string | null): void => setCustomToken(token);

/**
 * Resolves the superadmin's row from the Supabase Auth session, or null when
 * there is no such session.
 */
export const getSuperadminUser = async (): Promise<AppUser | null> => {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;

  return toAppUser(await authApi.fetchCurrentUser(userId));
};

/**
 * Re-reads a custom user's row using their persisted token. Returns null if the
 * token has expired or the account has since been disabled — the token itself
 * cannot express either, so it has to be checked against the database.
 */
export const refreshCustomUser = async (userId: string): Promise<AppUser | null> => {
  const user = toAppUser(await authApi.fetchCurrentUser(userId));
  return user.isActive && user.approvalStatus === 'approved' ? user : null;
};
