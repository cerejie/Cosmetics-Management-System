import type {
  CategoryRow,
  ProductRow,
  StockMovementRow,
  StockMovementType,
} from '@/types/common/database.types';

export type { StockMovementType };

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface Product {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly brand: string;
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly costPrice: number;
  readonly unitPrice: number;
  readonly stockQuantity: number;
  readonly reorderLevel: number;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface StockMovement {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly type: StockMovementType;
  readonly quantity: number;
  readonly quantityAfter: number;
  readonly reason: string;
  readonly createdAt: string;
}

/** Row shape returned when products are selected with their category joined. */
export type ProductRowWithCategory = ProductRow & {
  readonly categories: Pick<CategoryRow, 'id' | 'name'> | null;
};

export type StockMovementRowWithProduct = StockMovementRow & {
  readonly products: Pick<ProductRow, 'id' | 'name'> | null;
};

export type StockLevel = 'out_of_stock' | 'low_stock' | 'in_stock';

export const getStockLevel = (product: Product): StockLevel => {
  if (product.stockQuantity <= 0) return 'out_of_stock';
  if (product.stockQuantity <= product.reorderLevel) return 'low_stock';
  return 'in_stock';
};

export const toCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  description: row.description,
});

export const toProduct = (row: ProductRowWithCategory): Product => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  brand: row.brand,
  categoryId: row.category_id,
  categoryName: row.categories?.name ?? null,
  costPrice: Number(row.cost_price),
  unitPrice: Number(row.unit_price),
  stockQuantity: row.stock_quantity,
  reorderLevel: row.reorder_level,
  isActive: row.is_active,
  createdAt: row.created_at,
});

export const toStockMovement = (row: StockMovementRowWithProduct): StockMovement => ({
  id: row.id,
  productId: row.product_id,
  productName: row.products?.name ?? 'Unknown product',
  type: row.type,
  quantity: row.quantity,
  quantityAfter: row.quantity_after,
  reason: row.reason,
  createdAt: row.created_at,
});
