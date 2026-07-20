import * as authApi from '@/api/auth/auth.api';
import { supabase } from '@/api/common/supabaseClient';
import { toProfile, type Credentials, type Profile } from '@/types/auth/auth.types';

export const signIn = (credentials: Credentials): Promise<void> => authApi.signIn(credentials);

export const signOut = (): Promise<void> => authApi.signOut();

export const getCurrentProfile = async (): Promise<Profile | null> => {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;

  const profile = toProfile(await authApi.fetchProfile(userId));
  return profile.isActive ? profile : null;
};

export const onAuthStateChange = (handler: () => void): (() => void) => {
  const { data } = supabase.auth.onAuthStateChange(() => handler());
  return () => data.subscription.unsubscribe();
};
