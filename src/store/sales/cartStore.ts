import { create } from 'zustand';
import type { CartLine } from '@/types/sales/sales.types';
import type { Product } from '@/types/inventory/inventory.types';
import type { ProductSort } from '@/utils/inventory/productFilters';

interface CartState {
  readonly lines: readonly CartLine[];

  /** Picker filters, kept separate from the inventory page's own filters. */
  readonly pickerSearch: string;
  readonly pickerCategoryId: string | null;
  readonly pickerLowStockOnly: boolean;
  readonly pickerSort: ProductSort;

  /** Panels and overlays owned by the new-sale screen. */
  readonly scanOpen: boolean;
  readonly advancedOpen: boolean;
  readonly tipDismissed: boolean;

  readonly setPickerSearch: (search: string) => void;
  readonly setPickerCategoryId: (categoryId: string | null) => void;
  readonly setPickerLowStockOnly: (lowStockOnly: boolean) => void;
  readonly setPickerSort: (sort: ProductSort) => void;
  readonly resetPickerFilters: () => void;

  readonly setScanOpen: (open: boolean) => void;
  readonly setAdvancedOpen: (open: boolean) => void;
  readonly dismissTip: () => void;

  readonly addProduct: (product: Product) => void;
  readonly setQuantity: (productId: string, quantity: number) => void;
  readonly removeLine: (productId: string) => void;
  readonly clear: () => void;
}

const toLine = (product: Product, quantity: number): CartLine => ({
  productId: product.id,
  productName: product.name,
  sku: product.sku,
  unitPrice: product.unitPrice,
  quantity,
  availableStock: product.stockQuantity,
});

export const useCartStore = create<CartState>((set) => ({
  lines: [],

  pickerSearch: '',
  pickerCategoryId: null,
  pickerLowStockOnly: false,
  pickerSort: 'name-asc',

  scanOpen: false,
  advancedOpen: false,
  tipDismissed: false,

  setPickerSearch: (pickerSearch) => set({ pickerSearch }),
  setPickerCategoryId: (pickerCategoryId) => set({ pickerCategoryId }),
  setPickerLowStockOnly: (pickerLowStockOnly) => set({ pickerLowStockOnly }),
  setPickerSort: (pickerSort) => set({ pickerSort }),
  resetPickerFilters: () =>
    set({ pickerSearch: '', pickerCategoryId: null, pickerLowStockOnly: false }),

  setScanOpen: (scanOpen) => set({ scanOpen }),
  setAdvancedOpen: (advancedOpen) => set({ advancedOpen }),
  dismissTip: () => set({ tipDismissed: true }),

  addProduct: (product) =>
    set((state) => {
      const existing = state.lines.find((line) => line.productId === product.id);

      if (!existing) {
        return { lines: [...state.lines, toLine(product, 1)] };
      }

      // Never let the cart exceed what is actually on hand.
      const quantity = Math.min(existing.quantity + 1, product.stockQuantity);
      return {
        lines: state.lines.map((line) =>
          line.productId === product.id ? { ...line, quantity } : line,
        ),
      };
    }),

  setQuantity: (productId, quantity) =>
    set((state) => ({
      lines: state.lines.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.max(1, Math.min(quantity, line.availableStock)) }
          : line,
      ),
    })),

  removeLine: (productId) =>
    set((state) => ({ lines: state.lines.filter((line) => line.productId !== productId) })),

  // Closing the discount dialog matters: an empty cart disables the checkout
  // form, and the dialog's own buttons inherit that.
  clear: () => set({ lines: [], pickerSearch: '', advancedOpen: false }),
}));
