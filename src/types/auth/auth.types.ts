import type { AppRole, ProfileRow } from '@/types/common/database.types';

export type { AppRole };

export interface Profile {
  readonly id: string;
  readonly fullName: string;
  readonly role: AppRole;
  readonly isActive: boolean;
}

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  fullName: row.full_name,
  role: row.role,
  isActive: row.is_active,
});
