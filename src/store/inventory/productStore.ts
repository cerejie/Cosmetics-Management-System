import { create } from 'zustand';
import * as productsService from '@/services/inventory/products.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { Product } from '@/types/inventory/inventory.types';
import type { CreateProductValues, ProductFormValues } from '@/schemas/inventory/product.schema';
import type { StockAdjustmentValues } from '@/schemas/inventory/stockAdjustment.schema';

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
  readonly adjustingProduct: Product | null;

  readonly loadProducts: () => Promise<void>;
  readonly setSearch: (search: string) => void;
  readonly setCategoryFilter: (categoryId: string | null) => void;
  readonly setLowStockOnly: (value: boolean) => void;
  readonly openCreateForm: () => void;
  readonly openEditForm: (product: Product) => void;
  readonly closeForm: () => void;
  readonly openStockAdjustment: (product: Product) => void;
  readonly closeStockAdjustment: () => void;
  readonly createProduct: (values: CreateProductValues) => Promise<void>;
  readonly updateProduct: (id: string, values: ProductFormValues) => Promise<void>;
  readonly deleteProduct: (id: string) => Promise<void>;
  readonly adjustStock: (productId: string, values: StockAdjustmentValues) => Promise<void>;
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
  adjustingProduct: null,

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

  openCreateForm: () => set({ formOpen: true, editingProduct: null }),
  openEditForm: (product) => set({ formOpen: true, editingProduct: product }),
  closeForm: () => set({ formOpen: false, editingProduct: null }),

  openStockAdjustment: (product) => set({ adjustingProduct: product }),
  closeStockAdjustment: () => set({ adjustingProduct: null }),

  createProduct: async (values) => {
    set({ saving: true });
    try {
      await productsService.createProduct(values);
      await get().loadProducts();
      set({ formOpen: false, editingProduct: null });
    } finally {
      set({ saving: false });
    }
  },

  updateProduct: async (id, values) => {
    set({ saving: true });
    try {
      await productsService.updateProduct(id, values);
      await get().loadProducts();
      set({ formOpen: false, editingProduct: null });
    } finally {
      set({ saving: false });
    }
  },

  deleteProduct: async (id) => {
    await productsService.deleteProduct(id);
    await get().loadProducts();
  },

  adjustStock: async (productId, values) => {
    set({ saving: true });
    try {
      await productsService.adjustStock(productId, values);
      await get().loadProducts();
      set({ adjustingProduct: null });
    } finally {
      set({ saving: false });
    }
  },
}));
