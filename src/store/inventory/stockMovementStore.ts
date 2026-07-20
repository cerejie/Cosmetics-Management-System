import { create } from 'zustand';
import * as stockMovementsService from '@/services/inventory/stockMovements.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { StockMovement } from '@/types/inventory/inventory.types';

interface StockMovementState {
  readonly movements: readonly StockMovement[];
  readonly status: AsyncStatus;
  readonly error: string | null;
  readonly loadMovements: () => Promise<void>;
}

export const useStockMovementStore = create<StockMovementState>((set) => ({
  movements: [],
  status: 'idle',
  error: null,

  loadMovements: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ movements: await stockMovementsService.listStockMovements(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load stock movements.') });
    }
  },
}));
