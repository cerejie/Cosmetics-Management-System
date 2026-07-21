import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import { usernameToEmail } from '@/config/constants';
import type { UserRow } from '@/types/common/database.types';
import type { Credentials } from '@/types/auth/auth.types';

/**
 * `identifier` is a username unless it contains '@', in which case it is used
 * as the email directly — that covers the bootstrap superadmin, who is created
 * in the Supabase dashboard with a real address.
 */
export const signIn = async ({ identifier, password }: Credentials): Promise<void> => {
  const trimmed = identifier.trim();
  const email = trimmed.includes('@') ? trimmed.toLowerCase() : usernameToEmail(trimmed);

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw toApiError(error, 'Unable to sign in.');
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw toApiError(error, 'Unable to sign out.');
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
