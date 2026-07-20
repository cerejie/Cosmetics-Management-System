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

export interface CreateProductPayload {
  readonly sku: string;
  readonly name: string;
  readonly brand: string;
  readonly category_id: string | null;
  readonly cost_price: number;
  readonly unit_price: number;
  readonly stock_quantity: number;
  readonly reorder_level: number;
  readonly is_active: boolean;
}

export type UpdateProductPayload = Omit<CreateProductPayload, 'stock_quantity'>;

export const createProduct = async (
  payload: CreateProductPayload,
): Promise<ProductRowWithCategory> => {
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select(PRODUCT_SELECT)
    .single<ProductRowWithCategory>();

  if (error) throw toApiError(error, 'Unable to create the product.');
  return data;
};

export const updateProduct = async (
  id: string,
  payload: UpdateProductPayload,
): Promise<ProductRowWithCategory> => {
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select(PRODUCT_SELECT)
    .single<ProductRowWithCategory>();

  if (error) throw toApiError(error, 'Unable to update the product.');
  return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw toApiError(error, 'Unable to delete the product.');
};

/**
 * Stock changes always go through the RPC so the movement log and the product
 * row stay consistent under concurrency.
 */
export const adjustStock = async (
  productId: string,
  signedQuantity: number,
  type: Extract<StockMovementType, 'purchase' | 'adjustment'>,
  reason: string,
): Promise<ProductRow> => {
  const { data, error } = await supabase
    .rpc('adjust_stock', {
      p_product_id: productId,
      p_quantity: signedQuantity,
      p_type: type,
      p_reason: reason,
    })
    .single<ProductRow>();

  if (error) throw toApiError(error, 'Unable to adjust stock.');
  return data;
};
