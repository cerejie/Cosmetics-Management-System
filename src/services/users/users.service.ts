import * as usersApi from '@/api/users/users.api';
import { toManagedUser, type ManagedUser } from '@/types/users/users.types';
import type { AppRole, ApprovalStatus } from '@/types/common/database.types';
import type { CreateUserValues } from '@/schemas/users/user.schema';

export const listUsers = async (): Promise<readonly ManagedUser[]> =>
  (await usersApi.fetchUsers()).map(toManagedUser);

export const createUser = async (values: CreateUserValues): Promise<ManagedUser> =>
  toManagedUser(
    await usersApi.createUser({
      username: values.username.trim().toLowerCase(),
      password: values.password,
      fullName: values.fullName.trim(),
      role: values.role,
    }),
  );

export const setUserRole = async (
  userId: string,
  role: AppRole,
  isActive: boolean,
): Promise<ManagedUser> => toManagedUser(await usersApi.setUserRole(userId, role, isActive));

export const setUserApproval = async (
  userId: string,
  status: Exclude<ApprovalStatus, 'pending'>,
): Promise<ManagedUser> => toManagedUser(await usersApi.setUserApproval(userId, status));

export const setUserPassword = (userId: string, password: string): Promise<void> =>
  usersApi.setUserPassword(userId, password);
