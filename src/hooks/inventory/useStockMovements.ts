import { useMemo } from 'react';
import { useStockMovementStore } from '@/store/inventory/stockMovementStore';
import {
  getStockDirection,
  summariseStockFlow,
  type StockFlowSummary,
  type StockMovement,
} from '@/types/inventory/inventory.types';

interface FilteredMovements {
  readonly movements: readonly StockMovement[];
  readonly loading: boolean;
  /** Totals for what is on screen, so they always agree with the table. */
  readonly summary: StockFlowSummary;
}

export const useFilteredStockMovements = (): FilteredMovements => {
  const movements = useStockMovementStore((state) => state.movements);
  const status = useStockMovementStore((state) => state.status);
  const search = useStockMovementStore((state) => state.search);
  const directionFilter = useStockMovementStore((state) => state.directionFilter);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return movements.filter((movement) => {
      if (directionFilter !== 'all' && getStockDirection(movement) !== directionFilter) {
        return false;
      }

      if (!term) return true;

      return (
        movement.productName.toLowerCase().includes(term) ||
        movement.reason.toLowerCase().includes(term)
      );
    });
  }, [movements, search, directionFilter]);

  const summary = useMemo(() => summariseStockFlow(filtered), [filtered]);

  return { movements: filtered, loading: status === 'loading', summary };
};
