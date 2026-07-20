import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { StockMovementRowWithProduct } from '@/types/inventory/inventory.types';

const MOVEMENT_SELECT = '*, products ( id, name )';

export const fetchStockMovements = async (
  limit = 200,
): Promise<readonly StockMovementRowWithProduct[]> => {
  const { data, error } = await supabase
    .from('stock_movements')
    .select(MOVEMENT_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<StockMovementRowWithProduct[]>();

  if (error) throw toApiError(error, 'Unable to load stock movements.');
  return data ?? [];
};
