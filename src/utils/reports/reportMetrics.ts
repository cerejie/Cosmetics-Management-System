import {
  bucketKeyOf,
  bucketKeysIn,
  bucketLabel,
  type DateRange,
  type ReportBucket,
} from '@/utils/reports/period';
import type { Sale } from '@/types/sales/sales.types';
import type { StockMovement } from '@/types/inventory/inventory.types';

/** Voided sales stay in the list but never count towards money or volume. */
const isCompleted = (sale: Sale): boolean => sale.status === 'completed';

export interface SalesTotals {
  readonly revenue: number;
  readonly grossSales: number;
  readonly discounts: number;
  readonly transactions: number;
  readonly itemsSold: number;
  readonly voided: number;
  readonly averageSale: number;
}

export const summariseSalesReport = (sales: readonly Sale[]): SalesTotals => {
  const totals = sales.reduce(
    (running, sale) => {
      if (!isCompleted(sale)) {
        return { ...running, voided: running.voided + 1 };
      }

      return {
        revenue: running.revenue + sale.total,
        grossSales: running.grossSales + sale.subtotal,
        discounts: running.discounts + sale.discountAmount,
        transactions: running.transactions + 1,
        itemsSold:
          running.itemsSold + sale.items.reduce((count, item) => count + item.quantity, 0),
        voided: running.voided,
      };
    },
    { revenue: 0, grossSales: 0, discounts: 0, transactions: 0, itemsSold: 0, voided: 0 },
  );

  return {
    ...totals,
    averageSale: totals.transactions > 0 ? totals.revenue / totals.transactions : 0,
  };
};

export interface SalesPeriodRow {
  readonly key: string;
  readonly label: string;
  readonly revenue: number;
  readonly discounts: number;
  readonly transactions: number;
  readonly itemsSold: number;
}

/** One row per bucket in the range, including the ones with no sales. */
export const groupSalesByPeriod = (
  sales: readonly Sale[],
  range: DateRange,
  bucket: ReportBucket,
): readonly SalesPeriodRow[] => {
  const rows = new Map<string, SalesPeriodRow>(
    bucketKeysIn(range, bucket).map((key) => [
      key,
      { key, label: bucketLabel(key, bucket), revenue: 0, discounts: 0, transactions: 0, itemsSold: 0 },
    ]),
  );

  for (const sale of sales) {
    if (!isCompleted(sale)) continue;

    const key = bucketKeyOf(sale.createdAt, bucket);
    const row = rows.get(key);
    if (!row) continue;

    rows.set(key, {
      ...row,
      revenue: row.revenue + sale.total,
      discounts: row.discounts + sale.discountAmount,
      transactions: row.transactions + 1,
      itemsSold: row.itemsSold + sale.items.reduce((count, item) => count + item.quantity, 0),
    });
  }

  return [...rows.values()];
};

export interface ProductSalesRow {
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly quantity: number;
  readonly revenue: number;
}

export const groupSalesByProduct = (sales: readonly Sale[]): readonly ProductSalesRow[] => {
  const rows = new Map<string, ProductSalesRow>();

  for (const sale of sales) {
    if (!isCompleted(sale)) continue;

    for (const item of sale.items) {
      const existing = rows.get(item.productId);
      rows.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: (existing?.quantity ?? 0) + item.quantity,
        revenue: (existing?.revenue ?? 0) + item.lineTotal,
      });
    }
  }

  return [...rows.values()].sort((a, b) => b.revenue - a.revenue);
};

export interface InventoryFlowRow {
  readonly productId: string;
  readonly productName: string;
  readonly stockIn: number;
  readonly stockOut: number;
  readonly net: number;
  /** On hand before the first movement in the range. */
  readonly opening: number;
  /** On hand after the last movement in the range. */
  readonly closing: number;
}

/**
 * Stocks in and stocks out per product for the period.
 *
 * Opening and closing come from the movement log's own before/after figures
 * rather than today's `products.stock_quantity`, so a historical report stays
 * correct however much has happened since. Movements arrive newest first.
 */
export const groupInventoryFlow = (
  movements: readonly StockMovement[],
): readonly InventoryFlowRow[] => {
  const rows = new Map<string, InventoryFlowRow>();

  for (const movement of movements) {
    const existing = rows.get(movement.productId);

    rows.set(movement.productId, {
      productId: movement.productId,
      productName: movement.productName,
      stockIn: (existing?.stockIn ?? 0) + Math.max(movement.quantity, 0),
      stockOut: (existing?.stockOut ?? 0) + Math.max(-movement.quantity, 0),
      net: (existing?.net ?? 0) + movement.quantity,
      // Newest first, so the first row seen is the closing figure and every
      // later (older) row overwrites the opening one.
      opening: movement.quantityBefore,
      closing: existing?.closing ?? movement.quantityAfter,
    });
  }

  return [...rows.values()].sort((a, b) => b.stockOut - a.stockOut);
};

export interface InventoryPeriodRow {
  readonly key: string;
  readonly label: string;
  readonly stockIn: number;
  readonly stockOut: number;
  readonly net: number;
}

export const groupInventoryByPeriod = (
  movements: readonly StockMovement[],
  range: DateRange,
  bucket: ReportBucket,
): readonly InventoryPeriodRow[] => {
  const rows = new Map<string, InventoryPeriodRow>(
    bucketKeysIn(range, bucket).map((key) => [
      key,
      { key, label: bucketLabel(key, bucket), stockIn: 0, stockOut: 0, net: 0 },
    ]),
  );

  for (const movement of movements) {
    const key = bucketKeyOf(movement.createdAt, bucket);
    const row = rows.get(key);
    if (!row) continue;

    rows.set(key, {
      ...row,
      stockIn: row.stockIn + Math.max(movement.quantity, 0),
      stockOut: row.stockOut + Math.max(-movement.quantity, 0),
      net: row.net + movement.quantity,
    });
  }

  return [...rows.values()];
};
