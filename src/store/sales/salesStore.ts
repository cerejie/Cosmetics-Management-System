import { create } from 'zustand';
import * as salesService from '@/services/sales/sales.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { Sale } from '@/types/sales/sales.types';
import type { CartLine } from '@/types/sales/sales.types';
import type { SaleFormValues } from '@/schemas/sales/sale.schema';

interface SalesState {
  readonly sales: readonly Sale[];
  readonly status: AsyncStatus;
  readonly error: string | null;
  readonly submitting: boolean;

  readonly search: string;
  readonly detailSale: Sale | null;

  readonly loadSales: () => Promise<void>;
  readonly setSearch: (search: string) => void;
  readonly openDetail: (sale: Sale) => void;
  readonly closeDetail: () => void;
  readonly createSale: (lines: readonly CartLine[], values: SaleFormValues) => Promise<string>;
  readonly voidSale: (saleId: string, reason: string) => Promise<void>;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],
  status: 'idle',
  error: null,
  submitting: false,

  search: '',
  detailSale: null,

  loadSales: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ sales: await salesService.listSales(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load purchases.') });
    }
  },

  setSearch: (search) => set({ search }),
  openDetail: (detailSale) => set({ detailSale }),
  closeDetail: () => set({ detailSale: null }),

  createSale: async (lines, values) => {
    set({ submitting: true });
    try {
      const reference = await salesService.createSale(lines, values);
      await get().loadSales();
      return reference;
    } finally {
      set({ submitting: false });
    }
  },

  voidSale: async (saleId, reason) => {
    await salesService.voidSale(saleId, reason);
    await get().loadSales();
    set({ detailSale: null });
  },
}));
