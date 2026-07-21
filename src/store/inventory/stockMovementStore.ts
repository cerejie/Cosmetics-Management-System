import { create } from 'zustand';
import * as stockMovementsService from '@/services/inventory/stockMovements.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { StockDirection, StockMovement } from '@/types/inventory/inventory.types';

export type DirectionFilter = StockDirection | 'all';

interface StockMovementState {
  readonly movements: readonly StockMovement[];
  readonly status: AsyncStatus;
  readonly error: string | null;

  readonly search: string;
  readonly directionFilter: DirectionFilter;

  readonly loadMovements: () => Promise<void>;
  readonly setSearch: (search: string) => void;
  readonly setDirectionFilter: (direction: DirectionFilter) => void;
}

export const useStockMovementStore = create<StockMovementState>((set) => ({
  movements: [],
  status: 'idle',
  error: null,

  search: '',
  directionFilter: 'all',

  loadMovements: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ movements: await stockMovementsService.listStockMovements(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load stock movements.') });
    }
  },

  setSearch: (search) => set({ search }),
  setDirectionFilter: (directionFilter) => set({ directionFilter }),
}));
