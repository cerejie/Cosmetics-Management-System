import dayjs from 'dayjs';
import * as salesApi from '@/api/sales/sales.api';
import * as stockMovementsApi from '@/api/inventory/stockMovements.api';
import { toSale, type Sale } from '@/types/sales/sales.types';
import { toStockMovement, type StockMovement } from '@/types/inventory/inventory.types';
import type { DateRange } from '@/utils/reports/period';

/**
 * A report's range is calendar days but the columns are timestamps, so the
 * bounds are the user's local midnights — the same day boundary the shop
 * closes on.
 */
const toInstants = (range: DateRange): readonly [string, string] => [
  dayjs(range.from).startOf('day').toISOString(),
  dayjs(range.to).endOf('day').toISOString(),
];

export const listSalesInRange = async (range: DateRange): Promise<readonly Sale[]> => {
  const [from, to] = toInstants(range);
  return (await salesApi.fetchSalesInRange(from, to)).map(toSale);
};

export const listStockMovementsInRange = async (
  range: DateRange,
): Promise<readonly StockMovement[]> => {
  const [from, to] = toInstants(range);
  return (await stockMovementsApi.fetchStockMovementsInRange(from, to)).map(toStockMovement);
};
