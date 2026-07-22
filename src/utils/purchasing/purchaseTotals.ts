import type { DiscountTypeValue } from '@/types/common/database.types';
import type { PurchaseDraftLine } from '@/types/purchasing/purchasing.types';

export interface PurchaseTotals {
  readonly itemCount: number;
  readonly totalQuantity: number;
  /** Sum of the line totals, each already net of its own line discount. */
  readonly subtotal: number;
  /** Pesos taken off the whole order. */
  readonly discount: number;
  readonly total: number;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Mirrors `public.purchase_discount_amount`, down to the clamping: a discount
 * can never be negative nor more than the amount it comes off. Keep the two in
 * step — the database figure is the one that gets stored.
 */
export const getDiscountAmount = (
  base: number,
  type: DiscountTypeValue,
  value: number,
): number => {
  const raw = type === 'percent' ? round2((base * clamp(value, 0, 100)) / 100) : round2(value);

  return clamp(raw, 0, Math.max(base, 0));
};

/** What a line costs before its own discount. */
export const getLineGross = (line: PurchaseDraftLine): number =>
  round2(line.unitCost * line.quantity);

export const getLineDiscount = (line: PurchaseDraftLine): number =>
  getDiscountAmount(getLineGross(line), line.discountType, line.discountValue);

/**
 * Mirrors the arithmetic in `create_purchase` so the total shown while typing
 * matches what the database stores. The server figure is authoritative; this is
 * a preview.
 */
export const getLineTotal = (line: PurchaseDraftLine): number =>
  getLineGross(line) - getLineDiscount(line);

export const getPurchaseTotals = (
  lines: readonly PurchaseDraftLine[],
  discountType: DiscountTypeValue = 'amount',
  discountValue = 0,
): PurchaseTotals => {
  const base = lines.reduce(
    (totals, line) => ({
      itemCount: totals.itemCount + 1,
      totalQuantity: totals.totalQuantity + line.quantity,
      subtotal: round2(totals.subtotal + getLineTotal(line)),
    }),
    { itemCount: 0, totalQuantity: 0, subtotal: 0 },
  );

  const discount = getDiscountAmount(base.subtotal, discountType, discountValue);

  return { ...base, discount, total: round2(base.subtotal - discount) };
};

/** A line only counts once a product is chosen and the quantity is positive. */
export const isCompleteLine = (line: PurchaseDraftLine): boolean =>
  line.productId !== null && line.quantity > 0;
