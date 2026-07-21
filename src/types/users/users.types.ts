import type { AppRole, ApprovalStatus, UserRow } from '@/types/common/database.types';

export interface ManagedUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: AppRole;
  readonly isActive: boolean;
  readonly approvalStatus: ApprovalStatus;
  readonly createdAt: string;
}

export const toManagedUser = (row: UserRow): ManagedUser => ({
  id: row.id,
  username: row.username,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  isActive: row.is_active,
  approvalStatus: row.approval_status,
  createdAt: row.created_at,
});
