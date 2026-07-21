import { getStockLevel, type Product } from '@/types/inventory/inventory.types';

export interface ProductFilters {
  readonly search: string;
  readonly categoryId: string | null;
  readonly lowStockOnly: boolean;
}

export const filterProducts = (
  products: readonly Product[],
  { search, categoryId, lowStockOnly }: ProductFilters,
): readonly Product[] => {
  const term = search.trim().toLowerCase();

  return products.filter((product) => {
    if (categoryId && product.categoryId !== categoryId) return false;
    if (lowStockOnly && getStockLevel(product) === 'in_stock') return false;
    if (!term) return true;

    return (
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      product.brand.toLowerCase().includes(term)
    );
  });
};

export type ProductSort = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-desc';

const COMPARATORS: Readonly<Record<ProductSort, (a: Product, b: Product) => number>> = {
  'name-asc': (a, b) => a.name.localeCompare(b.name),
  'name-desc': (a, b) => b.name.localeCompare(a.name),
  'price-asc': (a, b) => a.unitPrice - b.unitPrice,
  'price-desc': (a, b) => b.unitPrice - a.unitPrice,
  'stock-desc': (a, b) => b.stockQuantity - a.stockQuantity,
};

export const sortProducts = (
  products: readonly Product[],
  sort: ProductSort,
): readonly Product[] => [...products].sort(COMPARATORS[sort]);

export interface InventorySummary {
  readonly totalProducts: number;
  readonly lowStockCount: number;
  readonly outOfStockCount: number;
  readonly stockValue: number;
}

export const summariseInventory = (products: readonly Product[]): InventorySummary =>
  products.reduce<InventorySummary>(
    (summary, product) => {
      const level = getStockLevel(product);
      return {
        totalProducts: summary.totalProducts + 1,
        lowStockCount: summary.lowStockCount + (level === 'low_stock' ? 1 : 0),
        outOfStockCount: summary.outOfStockCount + (level === 'out_of_stock' ? 1 : 0),
        stockValue: summary.stockValue + product.costPrice * product.stockQuantity,
      };
    },
    { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, stockValue: 0 },
  );
