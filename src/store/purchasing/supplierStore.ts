import { create } from 'zustand';
import * as suppliersService from '@/services/purchasing/suppliers.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { Supplier } from '@/types/purchasing/purchasing.types';
import type { SupplierFormValues } from '@/schemas/purchasing/supplier.schema';

interface SupplierState {
  readonly suppliers: readonly Supplier[];
  readonly status: AsyncStatus;
  readonly error: string | null;
  readonly saving: boolean;

  readonly search: string;
  readonly formOpen: boolean;
  readonly editingSupplier: Supplier | null;

  readonly loadSuppliers: () => Promise<void>;
  readonly setSearch: (search: string) => void;
  readonly openCreateForm: () => void;
  readonly openEditForm: (supplier: Supplier) => void;
  readonly closeForm: () => void;
  readonly saveSupplier: (id: string | null, values: SupplierFormValues) => Promise<void>;
  readonly deleteSupplier: (id: string) => Promise<void>;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  status: 'idle',
  error: null,
  saving: false,

  search: '',
  formOpen: false,
  editingSupplier: null,

  loadSuppliers: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ suppliers: await suppliersService.listSuppliers(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load suppliers.') });
    }
  },

  setSearch: (search) => set({ search }),

  openCreateForm: () => set({ formOpen: true, editingSupplier: null }),
  openEditForm: (supplier) => set({ formOpen: true, editingSupplier: supplier }),
  closeForm: () => set({ formOpen: false, editingSupplier: null }),

  saveSupplier: async (id, values) => {
    set({ saving: true });
    try {
      await suppliersService.saveSupplier(id, values);
      await get().loadSuppliers();
      set({ formOpen: false, editingSupplier: null });
    } finally {
      set({ saving: false });
    }
  },

  deleteSupplier: async (id) => {
    await suppliersService.deleteSupplier(id);
    await get().loadSuppliers();
  },
}));
