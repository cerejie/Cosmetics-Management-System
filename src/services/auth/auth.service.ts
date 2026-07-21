import * as authApi from '@/api/auth/auth.api';
import { supabase } from '@/api/common/supabaseClient';
import { toAppUser, type AppUser, type Credentials } from '@/types/auth/auth.types';

export const signIn = (credentials: Credentials): Promise<void> => authApi.signIn(credentials);

export const signOut = (): Promise<void> => authApi.signOut();

export const getCurrentUser = async (): Promise<AppUser | null> => {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;

  const user = toAppUser(await authApi.fetchCurrentUser(userId));
  return user.isActive ? user : null;
};

export const onAuthStateChange = (handler: () => void): (() => void) => {
  const { data } = supabase.auth.onAuthStateChange(() => handler());
  return () => data.subscription.unsubscribe();
};
