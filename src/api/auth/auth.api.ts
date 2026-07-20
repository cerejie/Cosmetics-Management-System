import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { ProfileRow } from '@/types/common/database.types';
import type { Credentials } from '@/types/auth/auth.types';

export const signIn = async ({ email, password }: Credentials): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw toApiError(error, 'Unable to sign in.');
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw toApiError(error, 'Unable to sign out.');
};

export const fetchProfile = async (userId: string): Promise<ProfileRow> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<ProfileRow>();

  if (error) throw toApiError(error, 'Unable to load your profile.');
  return data;
};
