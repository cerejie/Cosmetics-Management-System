import type { AppRole, ApprovalStatus, UserRow } from '@/types/common/database.types';

export type { AppRole, ApprovalStatus };

/**
 * Which of the two authentication paths produced the current session.
 *
 * `superadmin` is the single real Supabase Auth account, signed in by email;
 * supabase-js owns and refreshes that session. `custom` is everyone else: the
 * `login` RPC mints a JWT we hold ourselves and cannot refresh.
 */
export type SessionKind = 'superadmin' | 'custom';

/** The signed-in user, as stored in public.users. */
export interface AppUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: AppRole;
  readonly isActive: boolean;
  readonly approvalStatus: ApprovalStatus;
}

export interface Credentials {
  /** The superadmin's email, or a username for every other account. */
  readonly identifier: string;
  readonly password: string;
}

/** What `public.login` returns: a session token plus the user's row. */
export interface CustomLoginResult {
  readonly token: string;
  readonly user: UserRow;
}

export const toAppUser = (row: UserRow): AppUser => ({
  id: row.id,
  username: row.username,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  isActive: row.is_active,
  approvalStatus: row.approval_status,
});

/**
 * Usernames cannot contain '@' — enforced by a zod regex and a CHECK constraint
 * on public.users — so one login field can tell the two account types apart
 * without tabs or an account-type selector.
 */
export const isEmailIdentifier = (identifier: string): boolean => identifier.includes('@');

/**
 * There is exactly one superadmin — the Supabase Auth account — so no role can
 * ever create another one.
 */
export type CreatableRole = Exclude<AppRole, 'superadmin'>;

/** Roles are hierarchical; each may only manage the roles below it. */
export const CREATABLE_ROLES: Readonly<Record<AppRole, readonly CreatableRole[]>> = {
  superadmin: ['admin', 'employee'],
  admin: ['employee'],
  employee: [],
};

export const ROLE_LABELS: Readonly<Record<AppRole, string>> = {
  superadmin: 'Super admin',
  admin: 'Admin',
  employee: 'Employee',
};

export const APPROVAL_STATUS_LABELS: Readonly<Record<ApprovalStatus, string>> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

/** Admin or above — the check used for managing inventory. */
export const isAdminRole = (role: AppRole | undefined): boolean =>
  role === 'superadmin' || role === 'admin';

export const canManageRole = (actor: AppRole | undefined, target: AppRole): boolean =>
  actor !== undefined && CREATABLE_ROLES[actor].some((role) => role === target);
