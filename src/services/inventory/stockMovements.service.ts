import * as stockMovementsApi from '@/api/inventory/stockMovements.api';
import { toStockMovement, type StockMovement } from '@/types/inventory/inventory.types';

export const listStockMovements = async (): Promise<readonly StockMovement[]> =>
  (await stockMovementsApi.fetchStockMovements()).map(toStockMovement);
