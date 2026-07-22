import { create } from 'zustand';
import * as productsService from '@/services/inventory/products.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type {
  ForceDeleteResult,
  Product,
  ProductHistorySummary,
  ProductRemoval,
} from '@/types/inventory/inventory.types';
import type { ProductFormValues } from '@/schemas/inventory/product.schema';

interface ProductState {
  readonly products: readonly Product[];
  readonly status: AsyncStatus;
  readonly error: string | null;
  readonly saving: boolean;

  /** UI state — kept here so components stay free of local state. */
  readonly search: string;
  readonly categoryFilter: string | null;
  readonly lowStockOnly: boolean;
  readonly formOpen: boolean;
  readonly editingProduct: Product | null;
  /**
   * Low Stock screen only. Null means "use each product's own level"; a number
   * overrides it so the whole list can be reviewed against one figure.
   */
  readonly lowStockThreshold: number | null;
  /** Which row's level is currently being saved, so only it shows as busy. */
  readonly reorderSavingId: string | null;

  readonly loadProducts: () => Promise<void>;
  readonly setSearch: (search: string) => void;
  readonly setCategoryFilter: (categoryId: string | null) => void;
  readonly setLowStockOnly: (value: boolean) => void;
  readonly setLowStockThreshold: (threshold: number | null) => void;
  /** Saves just the reorder level, leaving the rest of the product as it is. */
  readonly updateReorderLevel: (product: Product, reorderLevel: number) => Promise<void>;
  readonly openCreateForm: () => void;
  readonly openEditForm: (product: Product) => void;
  readonly closeForm: () => void;
  /** `id` null creates, otherwise updates. */
  readonly saveProduct: (id: string | null, values: ProductFormValues) => Promise<void>;
  /** Creates and returns the product, for the purchase screen's quick add. */
  readonly createProduct: (values: ProductFormValues) => Promise<Product>;
  /** Resolves with what happened, so the page can say which one it was. */
  readonly deleteProduct: (id: string) => Promise<ProductRemoval>;

  /**
   * Force delete. The product being erased, the history it would take with it,
   * and what the owner has typed into the confirmation box. Kept here rather
   * than in the modal so the screen has no local state of its own.
   */
  readonly forceDeleteTarget: Product | null;
  readonly forceDeleteHistory: ProductHistorySummary | null;
  readonly forceDeleteLoadingHistory: boolean;
  readonly forceDeleteConfirmation: string;
  readonly forceDeleting: boolean;

  /** Opens the dialog and reads what the product would take with it. */
  readonly openForceDelete: (product: Product) => Promise<void>;
  readonly closeForceDelete: () => void;
  readonly setForceDeleteConfirmation: (value: string) => void;
  readonly forceDeleteProduct: () => Promise<ForceDeleteResult>;
}

/** What the owner has to type before the button will do anything. */
export const FORCE_DELETE_PHRASE = 'confirm';

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  status: 'idle',
  error: null,
  saving: false,

  search: '',
  categoryFilter: null,
  lowStockOnly: false,
  formOpen: false,
  editingProduct: null,
  lowStockThreshold: null,
  reorderSavingId: null,

  loadProducts: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ products: await productsService.listProducts(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load products.') });
    }
  },

  setSearch: (search) => set({ search }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setLowStockOnly: (lowStockOnly) => set({ lowStockOnly }),
  setLowStockThreshold: (lowStockThreshold) => set({ lowStockThreshold }),

  updateReorderLevel: async (product, reorderLevel) => {
    set({ reorderSavingId: product.id });
    try {
      await productsService.saveProduct(product.id, {
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        categoryId: product.categoryId,
        costPrice: product.costPrice,
        unitPrice: product.unitPrice,
        reorderLevel,
        isActive: product.isActive,
      });
      await get().loadProducts();
    } finally {
      set({ reorderSavingId: null });
    }
  },

  openCreateForm: () => set({ formOpen: true, editingProduct: null }),
  openEditForm: (product) => set({ formOpen: true, editingProduct: product }),
  closeForm: () => set({ formOpen: false, editingProduct: null }),

  saveProduct: async (id, values) => {
    set({ saving: true });
    try {
      await productsService.saveProduct(id, values);
      await get().loadProducts();
      set({ formOpen: false, editingProduct: null });
    } finally {
      set({ saving: false });
    }
  },

  createProduct: async (values) => {
    set({ saving: true });
    try {
      const product = await productsService.createProduct(values);
      await get().loadProducts();
      return product;
    } finally {
      set({ saving: false });
    }
  },

  deleteProduct: async (id) => {
    const removal = await productsService.deleteProduct(id);
    await get().loadProducts();
    return removal;
  },

  forceDeleteTarget: null,
  forceDeleteHistory: null,
  forceDeleteLoadingHistory: false,
  forceDeleteConfirmation: '',
  forceDeleting: false,

  openForceDelete: async (product) => {
    set({
      forceDeleteTarget: product,
      forceDeleteHistory: null,
      forceDeleteConfirmation: '',
      forceDeleteLoadingHistory: true,
    });

    try {
      const history = await productsService.getProductHistory(product.id);
      // The dialog may have been closed, or another product opened, while the
      // counts were loading; only the current target's figures are wanted.
      if (get().forceDeleteTarget?.id === product.id) set({ forceDeleteHistory: history });
    } finally {
      set({ forceDeleteLoadingHistory: false });
    }
  },

  closeForceDelete: () =>
    set({ forceDeleteTarget: null, forceDeleteHistory: null, forceDeleteConfirmation: '' }),

  setForceDeleteConfirmation: (forceDeleteConfirmation) => set({ forceDeleteConfirmation }),

  forceDeleteProduct: async () => {
    const { forceDeleteTarget, forceDeleteConfirmation } = get();

    if (!forceDeleteTarget) throw new Error('No product selected.');

    // Repeated from the dialog: the button is disabled until the phrase matches,
    // but the guard belongs with the action, not with the markup.
    if (forceDeleteConfirmation.trim().toLowerCase() !== FORCE_DELETE_PHRASE) {
      throw new Error(`Type "${FORCE_DELETE_PHRASE}" to confirm.`);
    }

    set({ forceDeleting: true });
    try {
      const erased = await productsService.forceDeleteProduct(forceDeleteTarget.id);
      await get().loadProducts();
      set({ forceDeleteTarget: null, forceDeleteHistory: null, forceDeleteConfirmation: '' });
      return erased;
    } finally {
      set({ forceDeleting: false });
    }
  },
}));
