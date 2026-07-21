import { create } from 'zustand';
import * as purchasesService from '@/services/purchasing/purchases.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { Purchase, PurchaseDraftLine } from '@/types/purchasing/purchasing.types';
import type { PurchaseFormValues } from '@/schemas/purchasing/purchase.schema';

let lineCounter = 0;

export const createEmptyLine = (): PurchaseDraftLine => {
  lineCounter += 1;
  return { key: `line-${lineCounter}`, productId: null, quantity: 1, unitCost: 0 };
};

/** One blank row so the table is never empty when the screen opens. */
const initialLines = (): readonly PurchaseDraftLine[] => [createEmptyLine()];

interface PurchaseState {
  readonly purchases: readonly Purchase[];
  readonly status: AsyncStatus;
  readonly error: string | null;
  readonly submitting: boolean;

  /** History filters. */
  readonly search: string;
  readonly supplierFilter: string | null;
  readonly categoryFilter: string | null;
  readonly dateRange: readonly [string, string] | null;
  readonly detailPurchase: Purchase | null;

  /** The purchase being typed in on the New Purchase screen. */
  readonly draftLines: readonly PurchaseDraftLine[];
  /** Which line is waiting for a brand-new product to be created for it. */
  readonly newProductForLine: string | null;

  readonly loadPurchases: () => Promise<void>;
  readonly setSearch: (search: string) => void;
  readonly setSupplierFilter: (supplierId: string | null) => void;
  readonly setCategoryFilter: (categoryId: string | null) => void;
  readonly setDateRange: (range: readonly [string, string] | null) => void;
  readonly clearFilters: () => void;
  readonly openDetail: (purchase: Purchase) => void;
  readonly closeDetail: () => void;

  readonly addLine: () => void;
  readonly addLines: (lines: readonly Omit<PurchaseDraftLine, 'key'>[]) => void;
  readonly updateLine: (key: string, patch: Partial<Omit<PurchaseDraftLine, 'key'>>) => void;
  readonly removeLine: (key: string) => void;
  readonly resetDraft: () => void;
  readonly openNewProduct: (lineKey: string) => void;
  readonly closeNewProduct: () => void;

  readonly createPurchase: (values: PurchaseFormValues) => Promise<string>;
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  purchases: [],
  status: 'idle',
  error: null,
  submitting: false,

  search: '',
  supplierFilter: null,
  categoryFilter: null,
  dateRange: null,
  detailPurchase: null,

  draftLines: initialLines(),
  newProductForLine: null,

  loadPurchases: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ purchases: await purchasesService.listPurchases(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load purchases.') });
    }
  },

  setSearch: (search) => set({ search }),
  setSupplierFilter: (supplierFilter) => set({ supplierFilter }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setDateRange: (dateRange) => set({ dateRange }),
  clearFilters: () =>
    set({ search: '', supplierFilter: null, categoryFilter: null, dateRange: null }),

  openDetail: (detailPurchase) => set({ detailPurchase }),
  closeDetail: () => set({ detailPurchase: null }),

  addLine: () => set((state) => ({ draftLines: [...state.draftLines, createEmptyLine()] })),

  addLines: (lines) =>
    set((state) => {
      // Blank rows are placeholders, so incoming lines fill them rather than
      // stacking underneath.
      const populated = state.draftLines.filter((line) => line.productId !== null);
      const existing = new Set(populated.map((line) => line.productId));
      const added = lines
        .filter((line) => !existing.has(line.productId))
        .map((line) => ({ ...createEmptyLine(), ...line }));

      return { draftLines: [...populated, ...added] };
    }),

  updateLine: (key, patch) =>
    set((state) => ({
      draftLines: state.draftLines.map((line) =>
        line.key === key ? { ...line, ...patch } : line,
      ),
    })),

  removeLine: (key) =>
    set((state) => {
      const remaining = state.draftLines.filter((line) => line.key !== key);
      return { draftLines: remaining.length > 0 ? remaining : [createEmptyLine()] };
    }),

  resetDraft: () => set({ draftLines: initialLines(), newProductForLine: null }),

  openNewProduct: (lineKey) => set({ newProductForLine: lineKey }),
  closeNewProduct: () => set({ newProductForLine: null }),

  createPurchase: async (values) => {
    set({ submitting: true });
    try {
      const reference = await purchasesService.createPurchase(values, get().draftLines);
      await get().loadPurchases();
      get().resetDraft();
      return reference;
    } finally {
      set({ submitting: false });
    }
  },
}));
