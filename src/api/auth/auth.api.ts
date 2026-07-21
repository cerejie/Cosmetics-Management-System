import { supabase, setCustomToken } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { UserRow } from '@/types/common/database.types';
import type { CustomLoginResult } from '@/types/auth/auth.types';

/**
 * Signs in a username account. `login` verifies the password server-side and
 * returns a JWT signed with the project's own secret; it is installed on the
 * client immediately so subsequent requests carry it.
 */
export const signInWithUsername = async (
  username: string,
  password: string,
): Promise<CustomLoginResult> => {
  const { data, error } = await supabase.rpc('login', {
    p_username: username.trim().toLowerCase(),
    p_password: password,
  });

  if (error) throw toApiError(error, 'Unable to sign in.');

  const result = data as CustomLoginResult;
  setCustomToken(result.token);
  return result;
};

/** Signs in the superadmin, the only real Supabase Auth account. */
export const signInWithEmail = async (email: string, password: string): Promise<void> => {
  // A stale custom token would shadow the Auth session on every request.
  setCustomToken(null);

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw toApiError(error, 'Unable to sign in.');
};

/** Self-registration. The account is created pending until an admin approves it. */
export const register = async (
  username: string,
  password: string,
  fullName: string,
): Promise<void> => {
  const { error } = await supabase.rpc('register', {
    p_username: username.trim().toLowerCase(),
    p_password: password,
    p_full_name: fullName.trim(),
  });

  if (error) throw toApiError(error, 'Unable to create the account.');
};

export const signOut = async (): Promise<void> => {
  setCustomToken(null);
  // Best-effort: the local session is already gone, and this must not fail
  // logout when the network is down or the Auth session was never ours.
  await supabase.auth.signOut().catch(() => undefined);
};

export const fetchCurrentUser = async (userId: string): Promise<UserRow> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single<UserRow>();

  if (error) throw toApiError(error, 'Unable to load your account.');
  return data;
};
