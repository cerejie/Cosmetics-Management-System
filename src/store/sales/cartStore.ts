import { create } from 'zustand';
import type { CartLine } from '@/types/sales/sales.types';
import type { Product } from '@/types/inventory/inventory.types';

interface CartState {
  readonly lines: readonly CartLine[];
  /** Search box in the sale's product picker, kept separate from the inventory filters. */
  readonly pickerSearch: string;
  readonly setPickerSearch: (search: string) => void;
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

  setPickerSearch: (pickerSearch) => set({ pickerSearch }),

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

  clear: () => set({ lines: [], pickerSearch: '' }),
}));
