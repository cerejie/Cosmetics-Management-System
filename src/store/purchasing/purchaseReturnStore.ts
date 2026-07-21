import { create } from 'zustand';
import * as purchaseReturnsService from '@/services/purchasing/purchaseReturns.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { PurchaseReturn } from '@/types/purchasing/purchasing.types';
import type { PurchaseReturnFormValues } from '@/schemas/purchasing/purchase.schema';

interface PurchaseReturnState {
  readonly returns: readonly PurchaseReturn[];
  readonly status: AsyncStatus;
  readonly error: string | null;
  readonly submitting: boolean;

  readonly search: string;
  readonly formOpen: boolean;
  readonly detailReturn: PurchaseReturn | null;

  readonly loadReturns: () => Promise<void>;
  readonly setSearch: (search: string) => void;
  readonly openForm: () => void;
  readonly closeForm: () => void;
  readonly openDetail: (purchaseReturn: PurchaseReturn) => void;
  readonly closeDetail: () => void;
  readonly createReturn: (values: PurchaseReturnFormValues) => Promise<string>;
}

export const usePurchaseReturnStore = create<PurchaseReturnState>((set, get) => ({
  returns: [],
  status: 'idle',
  error: null,
  submitting: false,

  search: '',
  formOpen: false,
  detailReturn: null,

  loadReturns: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ returns: await purchaseReturnsService.listPurchaseReturns(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load returns.') });
    }
  },

  setSearch: (search) => set({ search }),
  openForm: () => set({ formOpen: true }),
  closeForm: () => set({ formOpen: false }),
  openDetail: (detailReturn) => set({ detailReturn }),
  closeDetail: () => set({ detailReturn: null }),

  createReturn: async (values) => {
    set({ submitting: true });
    try {
      const reference = await purchaseReturnsService.createPurchaseReturn(values);
      await get().loadReturns();
      set({ formOpen: false });
      return reference;
    } finally {
      set({ submitting: false });
    }
  },
}));
