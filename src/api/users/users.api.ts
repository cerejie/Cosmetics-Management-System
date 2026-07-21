import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { AppRole, ApprovalStatus, UserRow } from '@/types/common/database.types';
import type { CreatableRole } from '@/types/auth/auth.types';

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
  readonly role: CreatableRole;
}

/**
 * Accounts are rows in public.users, not Supabase Auth users, so this is a
 * plain RPC — no service_role key and no Edge Function. admin_create_user
 * re-checks the role hierarchy server-side.
 */
export const createUser = async (payload: CreateUserPayload): Promise<UserRow> => {
  const { data, error } = await supabase.rpc('admin_create_user', {
    p_username: payload.username,
    p_password: payload.password,
    p_full_name: payload.fullName,
    p_role: payload.role,
  });

  if (error) throw toApiError(error, 'Unable to create the account.');
  return data as UserRow;
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

export const setUserApproval = async (
  userId: string,
  status: Exclude<ApprovalStatus, 'pending'>,
): Promise<UserRow> => {
  const { data, error } = await supabase.rpc('set_user_approval', {
    p_user_id: userId,
    p_status: status,
  });

  if (error) throw toApiError(error, 'Unable to update the account.');
  return data as UserRow;
};

/** There is no email delivery, so resets are performed by an admin. */
export const setUserPassword = async (userId: string, password: string): Promise<void> => {
  const { error } = await supabase.rpc('admin_set_password', {
    p_user_id: userId,
    p_password: password,
  });

  if (error) throw toApiError(error, 'Unable to change the password.');
};
