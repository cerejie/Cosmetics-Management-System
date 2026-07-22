import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as purchasesService from '@/services/purchasing/purchases.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type {
  Purchase,
  PurchaseDraftHeader,
  PurchaseDraftLine,
  PurchaseEdit,
} from '@/types/purchasing/purchasing.types';
import type {
  PurchaseDetailsFormValues,
  PurchaseFormValues,
} from '@/schemas/purchasing/purchase.schema';

let lineCounter = 0;

export const createEmptyLine = (): PurchaseDraftLine => {
  lineCounter += 1;
  return {
    key: `line-${lineCounter}`,
    productId: null,
    quantity: 1,
    unitCost: 0,
    discountType: 'amount',
    discountValue: 0,
  };
};

/** One blank row so the table is never empty when the screen opens. */
const initialLines = (): readonly PurchaseDraftLine[] => [createEmptyLine()];

const emptyHeader = (): PurchaseDraftHeader => ({
  supplierId: null,
  purchaseDate: '',
  invoiceNumber: '',
  referenceNo: '',
  paymentMethod: '',
  paymentTerms: '',
  discountType: 'amount',
  discountValue: 0,
  note: '',
});

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
  readonly draftHeader: PurchaseDraftHeader;
  readonly draftLines: readonly PurchaseDraftLine[];
  /** When the user last pressed "Save as draft", ISO. Null if they never did. */
  readonly draftSavedAt: string | null;
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

  readonly setDraftHeader: (patch: Partial<PurchaseDraftHeader>) => void;
  readonly addLine: () => void;
  /**
   * Used by Low Stock and Order Suggestions to prefill the screen. They name a
   * product, a quantity and a cost; everything else takes its blank-row default.
   */
  readonly addLines: (
    lines: readonly Pick<PurchaseDraftLine, 'productId' | 'quantity' | 'unitCost'>[],
  ) => void;
  readonly updateLine: (key: string, patch: Partial<Omit<PurchaseDraftLine, 'key'>>) => void;
  readonly removeLine: (key: string) => void;
  readonly markDraftSaved: () => void;
  readonly resetDraft: () => void;
  readonly openNewProduct: (lineKey: string) => void;
  readonly closeNewProduct: () => void;

  readonly createPurchase: (values: PurchaseFormValues) => Promise<string>;

  /**
   * The purchase open in the edit dialog, with its correction log. Both tabs of
   * that dialog read from here, so opening it loads the log once.
   */
  readonly editPurchase: Purchase | null;
  readonly editTab: PurchaseEditTab;
  readonly edits: readonly PurchaseEdit[];
  readonly editsLoading: boolean;
  readonly savingDetails: boolean;

  readonly openEdit: (purchase: Purchase) => Promise<void>;
  readonly closeEdit: () => void;
  readonly loadEditLog: (purchaseId: string) => Promise<void>;
  readonly setEditTab: (tab: PurchaseEditTab) => void;
  readonly updatePurchaseDetails: (values: PurchaseDetailsFormValues) => Promise<void>;
}

/** The two tabs of the edit dialog: the paperwork, and what has been changed. */
export type PurchaseEditTab = 'details' | 'log';

/**
 * The in-progress purchase is persisted to local storage, so a reload or a trip
 * to another screen mid-delivery does not lose the typing. "Save as draft" only
 * stamps `draftSavedAt`; there is nothing to upload, because a draft has no
 * effect on stock and belongs to the person typing it, not to the business.
 */
export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set, get) => ({
      purchases: [],
      status: 'idle',
      error: null,
      submitting: false,

      search: '',
      supplierFilter: null,
      categoryFilter: null,
      dateRange: null,
      detailPurchase: null,

      draftHeader: emptyHeader(),
      draftLines: initialLines(),
      draftSavedAt: null,
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

      setDraftHeader: (patch) =>
        set((state) => ({ draftHeader: { ...state.draftHeader, ...patch } })),

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

      markDraftSaved: () => set({ draftSavedAt: new Date().toISOString() }),

      resetDraft: () =>
        set({
          draftHeader: emptyHeader(),
          draftLines: initialLines(),
          draftSavedAt: null,
          newProductForLine: null,
        }),

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

      editPurchase: null,
      editTab: 'details',
      edits: [],
      editsLoading: false,
      savingDetails: false,

      openEdit: async (purchase) => {
        set({ editPurchase: purchase, editTab: 'details', edits: [] });
        await get().loadEditLog(purchase.id);
      },

      closeEdit: () => set({ editPurchase: null, edits: [] }),

      loadEditLog: async (purchaseId) => {
        set({ editsLoading: true });
        try {
          const edits = await purchasesService.listPurchaseEdits(purchaseId);
          // The dialog may have been closed, or another purchase opened, while
          // the log was loading.
          if (get().editPurchase?.id === purchaseId) set({ edits });
        } finally {
          set({ editsLoading: false });
        }
      },

      setEditTab: (editTab) => set({ editTab }),

      updatePurchaseDetails: async (values) => {
        const purchase = get().editPurchase;
        if (!purchase) return;

        set({ savingDetails: true });
        try {
          await purchasesService.updatePurchaseDetails(purchase.id, values);
          await get().loadPurchases();

          // The dialog stays open on the log tab, so the correction that was
          // just made is visible rather than only asserted by a toast.
          const updated = get().purchases.find((row) => row.id === purchase.id) ?? null;
          set({ editPurchase: updated, editTab: 'log' });
          await get().loadEditLog(purchase.id);
        } finally {
          set({ savingDetails: false });
        }
      },
    }),
    {
      name: 'cms.purchase-draft',
      // Server data and filters are deliberately left out: only the purchase
      // being typed is worth surviving a reload.
      partialize: (state) => ({
        draftHeader: state.draftHeader,
        draftLines: state.draftLines,
        draftSavedAt: state.draftSavedAt,
      }),
      onRehydrateStorage: () => (state) => {
        // Line keys come from a counter that restarts at zero on every load, so
        // it is wound past the restored rows: otherwise the next added line
        // reuses a key that is already on screen. Rows removed before the
        // reload leave gaps, hence the highest suffix rather than the count.
        if (!state) return;

        lineCounter = state.draftLines.reduce((highest, line) => {
          const suffix = Number.parseInt(line.key.replace('line-', ''), 10);
          return Number.isNaN(suffix) ? highest : Math.max(highest, suffix);
        }, 0);
      },
    },
  ),
);
