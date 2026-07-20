import { useMemo } from 'react';
import { useCartStore } from '@/store/sales/cartStore';
import { getCartSubtotal, type CartLine } from '@/types/sales/sales.types';

interface UseCartResult {
  readonly lines: readonly CartLine[];
  readonly subtotal: number;
  readonly itemCount: number;
  readonly isEmpty: boolean;
}

export const useCart = (): UseCartResult => {
  const lines = useCartStore((state) => state.lines);

  return useMemo(
    () => ({
      lines,
      subtotal: getCartSubtotal(lines),
      itemCount: lines.reduce((count, line) => count + line.quantity, 0),
      isEmpty: lines.length === 0,
    }),
    [lines],
  );
};
