import type { AppRole, UserRow } from '@/types/common/database.types';

export type { AppRole };

/** The signed-in user, as stored in public.users. */
export interface AppUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: AppRole;
  readonly isActive: boolean;
}

export interface Credentials {
  /** Username, or an email for accounts created outside the app. */
  readonly identifier: string;
  readonly password: string;
}

export const toAppUser = (row: UserRow): AppUser => ({
  id: row.id,
  username: row.username,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  isActive: row.is_active,
});

/** Roles are hierarchical; each may only manage the roles below it. */
export const CREATABLE_ROLES: Readonly<Record<AppRole, readonly AppRole[]>> = {
  superadmin: ['admin', 'employee'],
  admin: ['employee'],
  employee: [],
};

export const ROLE_LABELS: Readonly<Record<AppRole, string>> = {
  superadmin: 'Super admin',
  admin: 'Admin',
  employee: 'Employee',
};

/** Admin or above — the check used for managing inventory. */
export const isAdminRole = (role: AppRole | undefined): boolean =>
  role === 'superadmin' || role === 'admin';

export const canManageRole = (actor: AppRole | undefined, target: AppRole): boolean =>
  actor !== undefined && CREATABLE_ROLES[actor].includes(target);
