import dayjs from 'dayjs';
import type { Product } from '@/types/inventory/inventory.types';
import type { Purchase } from '@/types/purchasing/purchasing.types';
import type { SoldLineRow } from '@/api/purchasing/salesVelocity.api';

export type SuggestionPriority = 'critical' | 'warning' | 'healthy';

export interface OrderSuggestion {
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly priority: SuggestionPriority;
  readonly currentStock: number;
  readonly reorderLevel: number;
  readonly averageDailySales: number;
  /** `null` when nothing has sold, so "days of cover" is undefined rather than infinite. */
  readonly daysRemaining: number | null;
  readonly suggestedQuantity: number;
  readonly supplierId: string | null;
  readonly supplierName: string | null;
  readonly leadTimeDays: number;
  readonly unitCost: number;
  readonly estimatedCost: number;
  /** Percentage change between the first and second half of the window. */
  readonly trendPercent: number | null;
  readonly confidence: number;
  readonly insights: readonly string[];
}

export interface SuggestionSummary {
  readonly productsToRestock: number;
  readonly estimatedCost: number;
  readonly suppliersInvolved: number;
  readonly criticalStockouts: number;
}

/** Used when a product has no delivery history to learn a lead time from. */
const DEFAULT_LEAD_TIME_DAYS = 7;

/** Days of demand an order should cover on top of the supplier's lead time. */
const TARGET_COVER_DAYS = 14;

interface Demand {
  readonly units: number;
  readonly firstHalfUnits: number;
  readonly secondHalfUnits: number;
  readonly saleEvents: number;
}

const emptyDemand: Demand = { units: 0, firstHalfUnits: 0, secondHalfUnits: 0, saleEvents: 0 };

const buildDemand = (
  soldLines: readonly SoldLineRow[],
  windowDays: number,
): ReadonlyMap<string, Demand> => {
  const midpoint = dayjs().subtract(windowDays / 2, 'day');
  const demand = new Map<string, Demand>();

  for (const line of soldLines) {
    const soldAt = line.sales?.created_at;
    if (!soldAt) continue;

    const current = demand.get(line.product_id) ?? emptyDemand;
    const inSecondHalf = dayjs(soldAt).isAfter(midpoint);

    demand.set(line.product_id, {
      units: current.units + line.quantity,
      firstHalfUnits: current.firstHalfUnits + (inSecondHalf ? 0 : line.quantity),
      secondHalfUnits: current.secondHalfUnits + (inSecondHalf ? line.quantity : 0),
      saleEvents: current.saleEvents + 1,
    });
  }

  return demand;
};

interface SupplyHistory {
  readonly supplierId: string;
  readonly supplierName: string;
  readonly unitCost: number;
  readonly leadTimeDays: number;
}

/**
 * The most recent purchase of each product decides who to buy from and at what
 * cost.
 */
const buildSupplyHistory = (
  purchases: readonly Purchase[],
): ReadonlyMap<string, SupplyHistory> => {
  const history = new Map<string, SupplyHistory>();

  const ordered = [...purchases].sort((a, b) =>
    a.purchaseDate.localeCompare(b.purchaseDate),
  );

  for (const purchase of ordered) {
    // Without an ordered-vs-arrived split there is nothing to measure, so every
    // supplier uses the same assumed lead time.
    const leadTimeDays = DEFAULT_LEAD_TIME_DAYS;

    for (const item of purchase.items) {
      history.set(item.productId, {
        supplierId: purchase.supplierId,
        supplierName: purchase.supplierName,
        unitCost: item.quantity > 0 ? item.lineTotal / item.quantity : item.unitCost,
        leadTimeDays,
      });
    }
  }

  return history;
};

const getPriority = (
  currentStock: number,
  reorderLevel: number,
  daysRemaining: number | null,
  leadTimeDays: number,
): SuggestionPriority => {
  if (currentStock <= 0) return 'critical';
  if (daysRemaining !== null && daysRemaining <= leadTimeDays) return 'critical';
  if (currentStock <= reorderLevel) return 'warning';
  if (daysRemaining !== null && daysRemaining <= leadTimeDays + 7) return 'warning';
  return 'healthy';
};

/**
 * How much of this recommendation rests on real evidence rather than defaults:
 * more sale events, a known supplier and a longer window all raise it.
 */
const getConfidence = (
  demand: Demand,
  hasSupplyHistory: boolean,
  windowDays: number,
): number => {
  const evidence = Math.min(40, demand.saleEvents * 4);
  const windowBonus = windowDays >= 90 ? 15 : windowDays >= 30 ? 10 : 5;
  const supplierBonus = hasSupplyHistory ? 15 : 0;
  const demandBonus = demand.units > 0 ? 15 : 0;

  return Math.min(95, 15 + evidence + windowBonus + supplierBonus + demandBonus);
};

const buildInsights = (
  product: Product,
  demand: Demand,
  daysRemaining: number | null,
  trendPercent: number | null,
  leadTimeDays: number,
  suggestedQuantity: number,
  supplierName: string | null,
): readonly string[] => {
  const insights: string[] = [];

  if (trendPercent !== null && Math.abs(trendPercent) >= 10) {
    const direction = trendPercent > 0 ? 'increased' : 'decreased';
    insights.push(`Sales ${direction} ${Math.abs(Math.round(trendPercent))}% over this period.`);
  }

  if (product.stockQuantity <= 0) {
    insights.push('Out of stock right now — every sale is being lost.');
  } else if (daysRemaining !== null) {
    insights.push(`May run out in ${Math.max(1, Math.round(daysRemaining))} days.`);
  }

  if (demand.units === 0) {
    insights.push('No sales in this window, so the quantity is based on the reorder level.');
  }

  insights.push(
    supplierName
      ? `${supplierName} lead time is approximately ${leadTimeDays} days.`
      : `No supplier history — assuming a ${leadTimeDays} day lead time.`,
  );

  insights.push(`Recommended quantity is ${suggestedQuantity} units.`);

  return insights;
};

/**
 * Turns sales velocity, stock on hand and purchase history into concrete
 * reorder recommendations. Pure and deterministic: the same inputs always give
 * the same advice, which is what makes it auditable.
 */
export const buildOrderSuggestions = (
  products: readonly Product[],
  soldLines: readonly SoldLineRow[],
  purchases: readonly Purchase[],
  windowDays: number,
): readonly OrderSuggestion[] => {
  const demandByProduct = buildDemand(soldLines, windowDays);
  const supplyByProduct = buildSupplyHistory(purchases);

  return products
    .filter((product) => product.isActive)
    .map((product) => {
      const demand = demandByProduct.get(product.id) ?? emptyDemand;
      const supply = supplyByProduct.get(product.id) ?? null;
      const leadTimeDays = supply?.leadTimeDays ?? DEFAULT_LEAD_TIME_DAYS;

      const averageDailySales = demand.units / windowDays;
      const daysRemaining =
        averageDailySales > 0 ? product.stockQuantity / averageDailySales : null;

      const targetStock =
        Math.ceil(averageDailySales * (leadTimeDays + TARGET_COVER_DAYS)) + product.reorderLevel;
      const suggestedQuantity = Math.max(0, targetStock - product.stockQuantity);

      const trendPercent =
        demand.firstHalfUnits > 0
          ? ((demand.secondHalfUnits - demand.firstHalfUnits) / demand.firstHalfUnits) * 100
          : null;

      const unitCost = supply?.unitCost ?? product.costPrice;
      const supplierName = supply?.supplierName ?? null;

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        priority: getPriority(
          product.stockQuantity,
          product.reorderLevel,
          daysRemaining,
          leadTimeDays,
        ),
        currentStock: product.stockQuantity,
        reorderLevel: product.reorderLevel,
        averageDailySales,
        daysRemaining,
        suggestedQuantity,
        supplierId: supply?.supplierId ?? null,
        supplierName,
        leadTimeDays,
        unitCost,
        estimatedCost: Math.round(unitCost * suggestedQuantity * 100) / 100,
        trendPercent,
        confidence: getConfidence(demand, supply !== null, windowDays),
        insights: buildInsights(
          product,
          demand,
          daysRemaining,
          trendPercent,
          leadTimeDays,
          suggestedQuantity,
          supplierName,
        ),
      };
    })
    .filter((suggestion) => suggestion.suggestedQuantity > 0)
    .sort((a, b) => {
      const rank: Readonly<Record<SuggestionPriority, number>> = {
        critical: 0,
        warning: 1,
        healthy: 2,
      };
      if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
      return b.estimatedCost - a.estimatedCost;
    });
};

export const summariseSuggestions = (
  suggestions: readonly OrderSuggestion[],
): SuggestionSummary => ({
  productsToRestock: suggestions.length,
  estimatedCost:
    Math.round(suggestions.reduce((sum, item) => sum + item.estimatedCost, 0) * 100) / 100,
  suppliersInvolved: new Set(
    suggestions.map((item) => item.supplierId).filter((id): id is string => id !== null),
  ).size,
  criticalStockouts: suggestions.filter((item) => item.priority === 'critical').length,
});

/** The headline insights shown above the table, drawn from the sharpest rows. */
export const buildHeadlineInsights = (
  suggestions: readonly OrderSuggestion[],
): readonly string[] => {
  if (suggestions.length === 0) return [];

  const insights: string[] = [];
  const rising = suggestions.filter(
    (item) => item.trendPercent !== null && item.trendPercent >= 10,
  );
  const [fastest] = [...suggestions]
    .filter((item) => item.daysRemaining !== null)
    .sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0));
  const outOfStock = suggestions.filter((item) => item.currentStock <= 0);

  if (rising.length > 0) {
    const steepest = rising.reduce((best, item) =>
      (item.trendPercent ?? 0) > (best.trendPercent ?? 0) ? item : best,
    );
    insights.push(
      `${steepest.productName} sales increased ${Math.round(steepest.trendPercent ?? 0)}% this period` +
        (rising.length > 1 ? `, along with ${rising.length - 1} other product(s).` : '.'),
    );
  }

  if (fastest?.daysRemaining !== undefined && fastest?.daysRemaining !== null) {
    insights.push(
      `${fastest.productName} may run out in ${Math.max(1, Math.round(fastest.daysRemaining))} days at the current rate.`,
    );
  }

  if (outOfStock.length > 0) {
    insights.push(
      `${outOfStock.length} product(s) are already out of stock and are losing sales today.`,
    );
  }

  const withSupplier = suggestions.filter((item) => item.supplierName !== null);
  if (withSupplier.length > 0) {
    const averageLeadTime = Math.round(
      withSupplier.reduce((sum, item) => sum + item.leadTimeDays, 0) / withSupplier.length,
    );
    insights.push(`Average supplier lead time is approximately ${averageLeadTime} days.`);
  }

  return insights;
};
