import type { DiscountMode } from '@/schemas/sales/sale.schema';

const roundToCents = (value: number): number => Math.round(value * 100) / 100;

/**
 * Converts whichever discount the cashier entered into pesos. Clamped to
 * `[0, subtotal]` so a stale percentage can never produce a negative total —
 * the form still rejects out-of-range input so the clamp stays invisible.
 */
export const resolveDiscountAmount = (
  mode: DiscountMode,
  value: number,
  subtotal: number,
): number => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const amount = mode === 'percent' ? (subtotal * safeValue) / 100 : safeValue;

  return roundToCents(Math.min(Math.max(amount, 0), subtotal));
};
