import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { ProductRow, StockMovementType } from '@/types/common/database.types';
import type { ProductRowWithCategory } from '@/types/inventory/inventory.types';

const PRODUCT_SELECT = '*, categories ( id, name )';

export const fetchProducts = async (): Promise<readonly ProductRowWithCategory[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .order('name', { ascending: true })
    .returns<ProductRowWithCategory[]>();

  if (error) throw toApiError(error, 'Unable to load products.');
  return data ?? [];
};

export interface SaveProductPayload {
  /** Omit or pass null to create. */
  readonly id: string | null;
  readonly sku: string;
  readonly name: string;
  readonly brand: string;
  readonly categoryId: string | null;
  readonly costPrice: number;
  readonly unitPrice: number;
  readonly stockQuantity: number;
  readonly reorderLevel: number;
  readonly isActive: boolean;
  readonly stockReason: string;
}

/**
 * Create and update both run through save_product: it locks the row, applies
 * the change, and logs any stock delta as a movement in one transaction.
 */
export const saveProduct = async (payload: SaveProductPayload): Promise<ProductRow> => {
  // These RPCs `returns public.products` (a single composite, not SETOF), so
  // PostgREST already responds with a bare object — do not add .single().
  const { data, error } = await supabase.rpc('save_product', {
    p_id: payload.id,
    p_sku: payload.sku,
    p_name: payload.name,
    p_brand: payload.brand,
    p_category_id: payload.categoryId,
    p_cost_price: payload.costPrice,
    p_unit_price: payload.unitPrice,
    p_stock_quantity: payload.stockQuantity,
    p_reorder_level: payload.reorderLevel,
    p_is_active: payload.isActive,
    p_stock_reason: payload.stockReason,
  });

  if (error) throw toApiError(error, 'Unable to save the product.');
  return data as ProductRow;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw toApiError(error, 'Unable to delete the product.');
};

/** Dedicated +/- adjustment, used by the stock adjustment modal. */
export const adjustStock = async (
  productId: string,
  signedQuantity: number,
  type: Extract<StockMovementType, 'purchase' | 'adjustment'>,
  reason: string,
): Promise<ProductRow> => {
  const { data, error } = await supabase.rpc('adjust_stock', {
    p_product_id: productId,
    p_quantity: signedQuantity,
    p_type: type,
    p_reason: reason,
  });

  if (error) throw toApiError(error, 'Unable to adjust stock.');
  return data as ProductRow;
};
