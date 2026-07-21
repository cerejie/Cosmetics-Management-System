import { create } from 'zustand';
import * as usersService from '@/services/users/users.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { AppRole } from '@/types/common/database.types';
import type { ManagedUser } from '@/types/users/users.types';
import type { CreateUserValues } from '@/schemas/users/user.schema';

interface UserState {
  readonly users: readonly ManagedUser[];
  readonly status: AsyncStatus;
  readonly error: string | null;
  readonly saving: boolean;
  readonly formOpen: boolean;

  readonly loadUsers: () => Promise<void>;
  readonly openCreateForm: () => void;
  readonly closeForm: () => void;
  readonly createUser: (values: CreateUserValues) => Promise<void>;
  readonly setUserRole: (userId: string, role: AppRole, isActive: boolean) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  status: 'idle',
  error: null,
  saving: false,
  formOpen: false,

  loadUsers: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ users: await usersService.listUsers(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load users.') });
    }
  },

  openCreateForm: () => set({ formOpen: true }),
  closeForm: () => set({ formOpen: false }),

  createUser: async (values) => {
    set({ saving: true });
    try {
      await usersService.createUser(values);
      await get().loadUsers();
      set({ formOpen: false });
    } finally {
      set({ saving: false });
    }
  },

  setUserRole: async (userId, role, isActive) => {
    await usersService.setUserRole(userId, role, isActive);
    await get().loadUsers();
  },
}));
