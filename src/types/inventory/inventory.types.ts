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
  /** Signed: positive is stock in, negative is stock out. */
  readonly quantity: number;
  /**
   * Derived, not stored. The movement log records the level it left behind, and
   * the level it started from is that minus the change — so the two are always
   * consistent even if a movement is inserted out of order.
   */
  readonly quantityBefore: number;
  readonly quantityAfter: number;
  readonly reason: string;
  readonly createdAt: string;
}

export type StockDirection = 'in' | 'out';

export const getStockDirection = (movement: StockMovement): StockDirection =>
  movement.quantity >= 0 ? 'in' : 'out';

export interface StockFlowSummary {
  readonly stockIn: number;
  readonly stockOut: number;
  readonly net: number;
}

/** Stock in and stock out as positive figures, plus their difference. */
export const summariseStockFlow = (
  movements: readonly StockMovement[],
): StockFlowSummary =>
  movements.reduce<StockFlowSummary>(
    (summary, movement) => ({
      stockIn: summary.stockIn + Math.max(movement.quantity, 0),
      stockOut: summary.stockOut + Math.max(-movement.quantity, 0),
      net: summary.net + movement.quantity,
    }),
    { stockIn: 0, stockOut: 0, net: 0 },
  );

/** Row shape returned when products are selected with their category joined. */
export type ProductRowWithCategory = ProductRow & {
  readonly categories: Pick<CategoryRow, 'id' | 'name'> | null;
};

export type StockMovementRowWithProduct = StockMovementRow & {
  readonly products: Pick<ProductRow, 'id' | 'name'> | null;
};

export type StockLevel = 'out_of_stock' | 'low_stock' | 'in_stock';

/**
 * What removing a product actually did. A product that appears in a sale,
 * purchase, return or movement is part of the audit trail, so it is archived
 * (deactivated) instead of deleted.
 */
export type ProductRemoval = 'deleted' | 'archived';

/**
 * How much history a product is carrying. Read before a force delete so the
 * confirmation can state, in figures, what is about to be destroyed.
 */
export interface ProductHistorySummary {
  readonly saleItems: number;
  readonly purchaseItems: number;
  readonly purchaseReturns: number;
  readonly stockMovements: number;
  readonly stockQuantity: number;
}

export const hasHistory = (summary: ProductHistorySummary): boolean =>
  summary.saleItems + summary.purchaseItems + summary.purchaseReturns + summary.stockMovements > 0;

/** What a force delete actually erased, for the confirmation message. */
export interface ForceDeleteResult extends ProductHistorySummary {
  readonly name: string;
  readonly sku: string;
}

/** Payload of `product_history_summary` / `force_delete_product`. */
export interface ProductHistoryRow {
  readonly sale_items: number;
  readonly purchase_items: number;
  readonly purchase_returns: number;
  readonly stock_movements: number;
  readonly stock_quantity: number;
  readonly name?: string;
  readonly sku?: string;
}

export const toProductHistorySummary = (row: ProductHistoryRow): ProductHistorySummary => ({
  saleItems: Number(row.sale_items),
  purchaseItems: Number(row.purchase_items),
  purchaseReturns: Number(row.purchase_returns),
  stockMovements: Number(row.stock_movements),
  stockQuantity: Number(row.stock_quantity),
});

export const toForceDeleteResult = (row: ProductHistoryRow): ForceDeleteResult => ({
  ...toProductHistorySummary(row),
  name: row.name ?? '',
  sku: row.sku ?? '',
});

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
  quantityBefore: row.quantity_after - row.quantity,
  quantityAfter: row.quantity_after,
  reason: row.reason,
  createdAt: row.created_at,
});
