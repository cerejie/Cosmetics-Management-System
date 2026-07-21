import { create } from 'zustand';
import * as productsService from '@/services/inventory/products.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { Product, ProductRemoval } from '@/types/inventory/inventory.types';
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
}

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
}));
