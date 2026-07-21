import { supabase } from '@/api/common/supabaseClient';
import { toApiError, ApiError } from '@/api/common/apiError';
import type { AppRole, UserRow } from '@/types/common/database.types';

export const fetchUsers = async (): Promise<readonly UserRow[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true })
    .returns<UserRow[]>();

  if (error) throw toApiError(error, 'Unable to load users.');
  return data ?? [];
};

export interface CreateUserPayload {
  readonly username: string;
  readonly password: string;
  readonly fullName: string;
  readonly role: AppRole;
}

const NOT_DEPLOYED_MESSAGE =
  'Could not reach the create-user function. It has most likely not been deployed yet — ' +
  'run "supabase functions deploy create-user", or add it from the Supabase dashboard ' +
  'under Edge Functions.';

/**
 * Account creation needs the service_role key, so it runs in the create-user
 * Edge Function. The caller's session token is forwarded for authorisation.
 */
export const createUser = async (payload: CreateUserPayload): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('create-user', { body: payload });

  if (error) {
    // A FunctionsFetchError means fetch never got a usable response. When the
    // function is missing, the platform's 404 carries no CORS headers, so the
    // browser blocks it and it surfaces here rather than as an HTTP error.
    if (error.name === 'FunctionsFetchError') {
      throw new ApiError(NOT_DEPLOYED_MESSAGE);
    }

    // Otherwise the real message is in the response body.
    const context: unknown = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      const body = (await context.json().catch(() => null)) as { error?: string } | null;
      if (body?.error) throw new ApiError(body.error);
    }

    throw toApiError(error, 'Unable to create the account.');
  }

  const body = data as { error?: string } | null;
  if (body?.error) throw new ApiError(body.error);
};

export const setUserRole = async (
  userId: string,
  role: AppRole,
  isActive: boolean,
): Promise<UserRow> => {
  const { data, error } = await supabase.rpc('set_user_role', {
    p_user_id: userId,
    p_role: role,
    p_is_active: isActive,
  });

  if (error) throw toApiError(error, 'Unable to update the account.');
  return data as UserRow;
};
