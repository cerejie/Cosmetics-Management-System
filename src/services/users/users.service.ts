import * as usersApi from '@/api/users/users.api';
import { toManagedUser, type ManagedUser } from '@/types/users/users.types';
import type { AppRole } from '@/types/common/database.types';
import type { CreateUserValues } from '@/schemas/users/user.schema';

export const listUsers = async (): Promise<readonly ManagedUser[]> =>
  (await usersApi.fetchUsers()).map(toManagedUser);

export const createUser = (values: CreateUserValues): Promise<void> =>
  usersApi.createUser({
    username: values.username.trim().toLowerCase(),
    password: values.password,
    fullName: values.fullName.trim(),
    role: values.role,
  });

export const setUserRole = async (
  userId: string,
  role: AppRole,
  isActive: boolean,
): Promise<ManagedUser> => toManagedUser(await usersApi.setUserRole(userId, role, isActive));
