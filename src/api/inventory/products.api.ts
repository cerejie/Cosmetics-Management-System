import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { ProductRow } from '@/types/common/database.types';
import type { ProductRemoval, ProductRowWithCategory } from '@/types/inventory/inventory.types';

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
  readonly reorderLevel: number;
  readonly isActive: boolean;
}

/**
 * Catalogue details only. Stock is not settable here — it moves solely through
 * receiving a purchase order, a sale, or a purchase return.
 */
export const saveProduct = async (payload: SaveProductPayload): Promise<ProductRow> => {
  // This RPC `returns public.products` (a single composite, not SETOF), so
  // PostgREST already responds with a bare object — do not add .single().
  const { data, error } = await supabase.rpc('save_product', {
    p_id: payload.id,
    p_sku: payload.sku,
    p_name: payload.name,
    p_brand: payload.brand,
    p_category_id: payload.categoryId,
    p_cost_price: payload.costPrice,
    p_unit_price: payload.unitPrice,
    p_reorder_level: payload.reorderLevel,
    p_is_active: payload.isActive,
  });

  if (error) throw toApiError(error, 'Unable to save the product.');
  return data as ProductRow;
};

/**
 * Sales, purchases, returns and stock movements all reference products, so a
 * plain DELETE raised a foreign key error the moment a product had ever been
 * sold. The RPC decides: no history means a real delete, otherwise the product
 * is deactivated and the audit trail stays intact.
 */
export const deleteProduct = async (id: string): Promise<ProductRemoval> => {
  const { data, error } = await supabase.rpc('delete_product', { p_id: id });

  if (error) throw toApiError(error, 'Unable to remove the product.');
  return data === 'archived' ? 'archived' : 'deleted';
};
