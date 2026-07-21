import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';

/** One sold line inside the analysis window — the raw input to the forecast. */
export interface SoldLineRow {
  readonly product_id: string;
  readonly quantity: number;
  readonly sales: { readonly created_at: string } | null;
}

/**
 * Units sold per product since `fromDate`, read straight from the sale lines.
 * Voided sales are excluded via the inner join, so a reversed sale never
 * inflates demand.
 */
export const fetchSoldLines = async (fromDate: string): Promise<readonly SoldLineRow[]> => {
  const { data, error } = await supabase
    .from('sale_items')
    .select('product_id, quantity, sales!inner ( created_at, status )')
    .eq('sales.status', 'completed')
    .gte('sales.created_at', fromDate)
    .returns<SoldLineRow[]>();

  if (error) throw toApiError(error, 'Unable to load sales history.');
  return data ?? [];
};
