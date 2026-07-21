import { create } from 'zustand';
import * as customersService from '@/services/sales/customers.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { Customer } from '@/types/sales/customers.types';
import type { CustomerFormValues } from '@/schemas/sales/customer.schema';

interface CustomerState {
  readonly customers: readonly Customer[];
  readonly status: AsyncStatus;
  readonly error: string | null;
  readonly saving: boolean;

  readonly search: string;
  readonly incompleteOnly: boolean;
  readonly formOpen: boolean;
  readonly editingCustomer: Customer | null;

  readonly loadCustomers: () => Promise<void>;
  /** Checkout needs the list but should not refetch it on every visit. */
  readonly ensureCustomers: () => Promise<void>;
  readonly setSearch: (search: string) => void;
  readonly setIncompleteOnly: (value: boolean) => void;
  readonly openCreateForm: () => void;
  readonly openEditForm: (customer: Customer) => void;
  readonly closeForm: () => void;
  readonly saveCustomer: (id: string | null, values: CustomerFormValues) => Promise<void>;
  readonly deleteCustomer: (id: string) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  status: 'idle',
  error: null,
  saving: false,

  search: '',
  incompleteOnly: false,
  formOpen: false,
  editingCustomer: null,

  loadCustomers: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ customers: await customersService.listCustomers(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load customers.') });
    }
  },

  ensureCustomers: async () => {
    const { status } = get();
    if (status === 'loading' || status === 'success') return;
    await get().loadCustomers();
  },

  setSearch: (search) => set({ search }),
  setIncompleteOnly: (incompleteOnly) => set({ incompleteOnly }),

  openCreateForm: () => set({ formOpen: true, editingCustomer: null }),
  openEditForm: (customer) => set({ formOpen: true, editingCustomer: customer }),
  closeForm: () => set({ formOpen: false, editingCustomer: null }),

  saveCustomer: async (id, values) => {
    set({ saving: true });
    try {
      await customersService.saveCustomer(id, values);
      await get().loadCustomers();
      set({ formOpen: false, editingCustomer: null });
    } finally {
      set({ saving: false });
    }
  },

  deleteCustomer: async (id) => {
    await customersService.deleteCustomer(id);
    await get().loadCustomers();
  },
}));
