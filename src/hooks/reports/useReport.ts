import { useMemo } from 'react';
import { useReportStore } from '@/store/reports/reportStore';
import {
  bucketFor,
  describeRange,
  resolveRange,
  type DateRange,
  type ReportBucket,
} from '@/utils/reports/period';
import {
  groupInventoryByPeriod,
  groupInventoryFlow,
  groupSalesByPeriod,
  groupSalesByProduct,
  summariseSalesReport,
  type InventoryFlowRow,
  type InventoryPeriodRow,
  type ProductSalesRow,
  type SalesPeriodRow,
  type SalesTotals,
} from '@/utils/reports/reportMetrics';
import { summariseStockFlow, type StockFlowSummary } from '@/types/inventory/inventory.types';
import type { Sale } from '@/types/sales/sales.types';

interface ReportBase {
  readonly range: DateRange;
  readonly rangeLabel: string;
  readonly bucket: ReportBucket;
  readonly loading: boolean;
}

/** The range every report screen is showing, derived from the store's period. */
export const useReportRange = (): ReportBase => {
  const period = useReportStore((state) => state.period);
  const customRange = useReportStore((state) => state.customRange);
  const status = useReportStore((state) => state.status);

  const range = useMemo(() => resolveRange(period, customRange), [period, customRange]);

  return {
    range,
    rangeLabel: describeRange(range),
    bucket: bucketFor(range),
    loading: status === 'loading',
  };
};

interface SalesReport extends ReportBase {
  readonly sales: readonly Sale[];
  readonly totals: SalesTotals;
  readonly byPeriod: readonly SalesPeriodRow[];
  readonly byProduct: readonly ProductSalesRow[];
}

export const useSalesReport = (): SalesReport => {
  const base = useReportRange();
  const sales = useReportStore((state) => state.sales);

  const totals = useMemo(() => summariseSalesReport(sales), [sales]);
  const byPeriod = useMemo(
    () => groupSalesByPeriod(sales, base.range, base.bucket),
    [sales, base.range, base.bucket],
  );
  const byProduct = useMemo(() => groupSalesByProduct(sales), [sales]);

  return { ...base, sales, totals, byPeriod, byProduct };
};

interface InventoryReport extends ReportBase {
  readonly summary: StockFlowSummary;
  readonly byProduct: readonly InventoryFlowRow[];
  readonly byPeriod: readonly InventoryPeriodRow[];
}

export const useInventoryReport = (): InventoryReport => {
  const base = useReportRange();
  const movements = useReportStore((state) => state.movements);

  const summary = useMemo(() => summariseStockFlow(movements), [movements]);
  const byProduct = useMemo(() => groupInventoryFlow(movements), [movements]);
  const byPeriod = useMemo(
    () => groupInventoryByPeriod(movements, base.range, base.bucket),
    [movements, base.range, base.bucket],
  );

  return { ...base, summary, byProduct, byPeriod };
};
