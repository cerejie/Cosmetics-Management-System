import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

/**
 * Custom users authenticate through the `login` RPC, which returns a JWT signed
 * with the project's own secret. That token is not supabase-issued, so it must
 * never go through `auth.setSession()` — supabase-js would try to refresh it and
 * would clobber the superadmin's real session. Instead it is held here and
 * swapped onto the Authorization header of every outgoing request.
 */
let customToken: string | null = null;

/** Called when the server rejects the custom token, i.e. it has expired. */
let onUnauthorised: (() => void) | null = null;

export const setCustomToken = (token: string | null): void => {
  customToken = token;
};

export const setUnauthorisedHandler = (handler: () => void): void => {
  onUnauthorised = handler;
};

const customFetch: typeof fetch = async (input, init) => {
  if (!customToken) return fetch(input, init);

  // Keep supabase's own headers (notably `apikey`) and override only the bearer.
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${customToken}`);

  const response = await fetch(input, { ...init, headers });

  // Custom tokens have a hard 8-hour life and cannot be refreshed. Without this
  // the app would sit there failing every request with a cryptic message.
  if (response.status === 401) {
    onUnauthorised?.();
  }

  return response;
};

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: { fetch: customFetch },
});
