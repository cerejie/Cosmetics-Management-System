import { useMemo } from 'react';
import { useSalesStore } from '@/store/sales/salesStore';
import {
  getDailyRevenue,
  getTopProducts,
  summariseSales,
  type DailyRevenuePoint,
  type SalesSummary,
  type TopProduct,
} from '@/utils/sales/salesMetrics';

interface UseSalesMetricsResult {
  readonly summary: SalesSummary;
  readonly dailyRevenue: readonly DailyRevenuePoint[];
  readonly topProducts: readonly TopProduct[];
  readonly loading: boolean;
}

export const useSalesMetrics = (): UseSalesMetricsResult => {
  const sales = useSalesStore((state) => state.sales);
  const status = useSalesStore((state) => state.status);

  return useMemo(
    () => ({
      summary: summariseSales(sales),
      dailyRevenue: getDailyRevenue(sales),
      topProducts: getTopProducts(sales),
      loading: status === 'loading',
    }),
    [sales, status],
  );
};
