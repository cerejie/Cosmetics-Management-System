import { useMemo } from 'react';
import { useProductStore } from '@/store/inventory/productStore';
import { filterProducts, summariseInventory } from '@/utils/inventory/productFilters';
import type { Product } from '@/types/inventory/inventory.types';
import type { InventorySummary } from '@/utils/inventory/productFilters';

interface UseFilteredProductsResult {
  readonly products: readonly Product[];
  readonly summary: InventorySummary;
  readonly loading: boolean;
}

/** Applies the store's filter state to the loaded products. */
export const useFilteredProducts = (): UseFilteredProductsResult => {
  const products = useProductStore((state) => state.products);
  const search = useProductStore((state) => state.search);
  const categoryFilter = useProductStore((state) => state.categoryFilter);
  const lowStockOnly = useProductStore((state) => state.lowStockOnly);
  const status = useProductStore((state) => state.status);

  const filtered = useMemo(
    () => filterProducts(products, { search, categoryId: categoryFilter, lowStockOnly }),
    [products, search, categoryFilter, lowStockOnly],
  );

  const summary = useMemo(() => summariseInventory(products), [products]);

  return { products: filtered, summary, loading: status === 'loading' };
};
