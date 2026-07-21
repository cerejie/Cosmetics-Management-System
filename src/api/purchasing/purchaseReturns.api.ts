import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { PurchaseReturnRow } from '@/types/common/database.types';
import type { PurchaseReturnRowWithRelations } from '@/types/purchasing/purchasing.types';

const RETURN_SELECT = `
  *,
  suppliers ( name ),
  created_by_user:users!purchase_returns_created_by_fkey ( full_name )
`;

export const fetchPurchaseReturns = async (
  limit = 300,
): Promise<readonly PurchaseReturnRowWithRelations[]> => {
  const { data, error } = await supabase
    .from('purchase_returns')
    .select(RETURN_SELECT)
    .order('return_date', { ascending: false })
    .limit(limit)
    .returns<PurchaseReturnRowWithRelations[]>();

  if (error) throw toApiError(error, 'Unable to load returns.');
  return data ?? [];
};

export interface CreatePurchaseReturnPayload {
  readonly supplierId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly reason: string;
  readonly returnDate: string;
}

/** The cost is read from the product inside the RPC, never sent by the client. */
export const createPurchaseReturn = async (
  payload: CreatePurchaseReturnPayload,
): Promise<PurchaseReturnRow> => {
  const { data, error } = await supabase.rpc('create_purchase_return', {
    p_supplier_id: payload.supplierId,
    p_product_id: payload.productId,
    p_quantity: payload.quantity,
    p_reason: payload.reason,
    p_return_date: payload.returnDate,
  });

  if (error) throw toApiError(error, 'Unable to save the return.');
  return data as PurchaseReturnRow;
};
