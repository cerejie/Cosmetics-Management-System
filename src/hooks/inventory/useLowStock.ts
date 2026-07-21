import { useMemo } from 'react';
import { useProductStore } from '@/store/inventory/productStore';
import { getStockLevel, type Product } from '@/types/inventory/inventory.types';

interface LowStockResult {
  readonly products: readonly Product[];
  readonly loading: boolean;
  readonly outOfStockCount: number;
  /** What it would cost to bring everything listed back up to its level. */
  readonly restockCost: number;
}

/**
 * Inactive products are left out: they are archived catalogue entries, not
 * something anyone is going to reorder.
 */
export const useLowStock = (): LowStockResult => {
  const products = useProductStore((state) => state.products);
  const status = useProductStore((state) => state.status);
  const search = useProductStore((state) => state.search);
  const threshold = useProductStore((state) => state.lowStockThreshold);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      if (!product.isActive) return false;

      const isLow =
        threshold === null
          ? getStockLevel(product) !== 'in_stock'
          : product.stockQuantity <= threshold;

      if (!isLow) return false;
      if (!term) return true;

      return (
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term)
      );
    });
  }, [products, search, threshold]);

  const { outOfStockCount, restockCost } = useMemo(
    () =>
      filtered.reduce(
        (totals, product) => ({
          outOfStockCount: totals.outOfStockCount + (product.stockQuantity <= 0 ? 1 : 0),
          restockCost:
            totals.restockCost +
            Math.max(product.reorderLevel - product.stockQuantity, 0) * product.costPrice,
        }),
        { outOfStockCount: 0, restockCost: 0 },
      ),
    [filtered],
  );

  return { products: filtered, loading: status === 'loading', outOfStockCount, restockCost };
};
