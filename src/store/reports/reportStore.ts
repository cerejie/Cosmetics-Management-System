import { create } from 'zustand';
import * as reportsService from '@/services/reports/reports.service';
import { getErrorMessage } from '@/api/common/apiError';
import { resolveRange, type DateRange, type ReportPeriod } from '@/utils/reports/period';
import type { AsyncStatus } from '@/types/common/api.types';
import type { Sale } from '@/types/sales/sales.types';
import type { StockMovement } from '@/types/inventory/inventory.types';

interface ReportState {
  readonly period: ReportPeriod;
  /** Only used when `period` is 'custom'. */
  readonly customRange: DateRange | null;

  readonly sales: readonly Sale[];
  readonly movements: readonly StockMovement[];
  readonly status: AsyncStatus;
  readonly error: string | null;

  readonly setPeriod: (period: ReportPeriod) => Promise<void>;
  readonly setCustomRange: (range: DateRange | null) => Promise<void>;
  readonly loadReport: () => Promise<void>;
}

/**
 * Both reports share one range and one fetch. Sales and movements are pulled
 * together because the range is the expensive decision, not the query, and it
 * keeps the two screens showing the same period when you switch between them.
 */
export const useReportStore = create<ReportState>((set, get) => ({
  period: 'monthly',
  customRange: null,

  sales: [],
  movements: [],
  status: 'idle',
  error: null,

  setPeriod: async (period) => {
    set({ period });
    await get().loadReport();
  },

  setCustomRange: async (customRange) => {
    set({ customRange, period: 'custom' });
    await get().loadReport();
  },

  loadReport: async () => {
    const range = resolveRange(get().period, get().customRange);
    set({ status: 'loading', error: null });

    try {
      const [sales, movements] = await Promise.all([
        reportsService.listSalesInRange(range),
        reportsService.listStockMovementsInRange(range),
      ]);

      set({ sales, movements, status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to build the report.') });
    }
  },
}));
