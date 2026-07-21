import type { PurchaseDraftLine } from '@/types/purchasing/purchasing.types';

export interface PurchaseTotals {
  readonly itemCount: number;
  readonly totalQuantity: number;
  readonly total: number;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Mirrors the arithmetic in `create_purchase` so the total shown while typing
 * matches what the database stores. The server figure is authoritative; this is
 * a preview.
 */
export const getLineTotal = (line: PurchaseDraftLine): number =>
  round2(line.unitCost * line.quantity);

export const getPurchaseTotals = (lines: readonly PurchaseDraftLine[]): PurchaseTotals =>
  lines.reduce<PurchaseTotals>(
    (totals, line) => ({
      itemCount: totals.itemCount + 1,
      totalQuantity: totals.totalQuantity + line.quantity,
      total: round2(totals.total + getLineTotal(line)),
    }),
    { itemCount: 0, totalQuantity: 0, total: 0 },
  );

/** A line only counts once a product is chosen and the quantity is positive. */
export const isCompleteLine = (line: PurchaseDraftLine): boolean =>
  line.productId !== null && line.quantity > 0;
