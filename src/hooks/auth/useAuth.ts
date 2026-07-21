import { useAuthStore } from '@/store/auth/authStore';
import { CREATABLE_ROLES, isAdminRole, type AppRole, type AppUser } from '@/types/auth/auth.types';

interface UseAuthResult {
  readonly user: AppUser | null;
  readonly role: AppRole | undefined;
  readonly isSuperadmin: boolean;
  /** Admin or above — may manage inventory. */
  readonly isAdmin: boolean;
  readonly isAuthenticated: boolean;
  /** Roles this user is allowed to create; empty for employees. */
  readonly creatableRoles: readonly AppRole[];
  readonly canManageUsers: boolean;
}

export const useAuth = (): UseAuthResult => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const creatableRoles = role ? CREATABLE_ROLES[role] : [];

  return {
    user,
    role,
    isSuperadmin: role === 'superadmin',
    isAdmin: isAdminRole(role),
    isAuthenticated: user !== null,
    creatableRoles,
    canManageUsers: creatableRoles.length > 0,
  };
};
