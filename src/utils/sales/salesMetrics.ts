import dayjs from 'dayjs';
import type { Sale } from '@/types/sales/sales.types';

export interface SalesSummary {
  readonly todayRevenue: number;
  readonly todayCount: number;
  readonly monthRevenue: number;
  readonly monthCount: number;
}

const isCompleted = (sale: Sale): boolean => sale.status === 'completed';

export const summariseSales = (sales: readonly Sale[]): SalesSummary => {
  const startOfDay = dayjs().startOf('day');
  const startOfMonth = dayjs().startOf('month');

  return sales.filter(isCompleted).reduce<SalesSummary>(
    (summary, sale) => {
      const createdAt = dayjs(sale.createdAt);
      const inToday = !createdAt.isBefore(startOfDay);
      const inMonth = !createdAt.isBefore(startOfMonth);

      return {
        todayRevenue: summary.todayRevenue + (inToday ? sale.total : 0),
        todayCount: summary.todayCount + (inToday ? 1 : 0),
        monthRevenue: summary.monthRevenue + (inMonth ? sale.total : 0),
        monthCount: summary.monthCount + (inMonth ? 1 : 0),
      };
    },
    { todayRevenue: 0, todayCount: 0, monthRevenue: 0, monthCount: 0 },
  );
};

export interface DailyRevenuePoint {
  readonly date: string;
  readonly revenue: number;
}

/** Revenue per day for the last `days` days, oldest first, zero-filled. */
export const getDailyRevenue = (sales: readonly Sale[], days = 14): readonly DailyRevenuePoint[] => {
  const buckets = new Map<string, number>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    buckets.set(dayjs().subtract(offset, 'day').format('YYYY-MM-DD'), 0);
  }

  for (const sale of sales) {
    if (!isCompleted(sale)) continue;
    const key = dayjs(sale.createdAt).format('YYYY-MM-DD');
    const current = buckets.get(key);
    if (current !== undefined) buckets.set(key, current + sale.total);
  }

  return [...buckets].map(([date, revenue]) => ({ date, revenue }));
};

export interface TopProduct {
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly revenue: number;
}

export const getTopProducts = (sales: readonly Sale[], limit = 5): readonly TopProduct[] => {
  const totals = new Map<string, TopProduct>();

  for (const sale of sales) {
    if (!isCompleted(sale)) continue;

    for (const item of sale.items) {
      const existing = totals.get(item.productId);
      totals.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        quantity: (existing?.quantity ?? 0) + item.quantity,
        revenue: (existing?.revenue ?? 0) + item.lineTotal,
      });
    }
  }

  return [...totals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
};

export const filterSales = (sales: readonly Sale[], search: string): readonly Sale[] => {
  const term = search.trim().toLowerCase();
  if (!term) return sales;

  return sales.filter(
    (sale) =>
      sale.reference.toLowerCase().includes(term) ||
      sale.customerName.toLowerCase().includes(term),
  );
};
