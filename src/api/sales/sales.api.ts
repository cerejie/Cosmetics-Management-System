import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { SaleRow } from '@/types/common/database.types';
import type { PaymentMethod, SaleRowWithRelations } from '@/types/sales/sales.types';

const SALE_SELECT = `
  *,
  sale_items ( * ),
  created_by_user:users!sales_created_by_fkey ( full_name )
`;

export const fetchSales = async (limit = 200): Promise<readonly SaleRowWithRelations[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select(SALE_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<SaleRowWithRelations[]>();

  if (error) throw toApiError(error, 'Unable to load purchases.');
  return data ?? [];
};

export interface CreateSalePayload {
  readonly items: readonly { readonly product_id: string; readonly quantity: number }[];
  readonly customerName: string;
  readonly paymentMethod: PaymentMethod;
  readonly discountAmount: number;
  readonly note: string;
}

/**
 * The RPC prices the sale from the database and decrements stock atomically —
 * the client never sends prices or totals.
 */
export const createSale = async (payload: CreateSalePayload): Promise<SaleRow> => {
  // Returns a single composite (`returns public.sales`), so PostgREST responds
  // with a bare object — .single() would be wrong here.
  const { data, error } = await supabase.rpc('create_sale', {
    p_items: payload.items,
    p_customer_name: payload.customerName,
    p_payment_method: payload.paymentMethod,
    p_discount_amount: payload.discountAmount,
    p_note: payload.note,
  });

  if (error) throw toApiError(error, 'Unable to record the purchase.');
  return data as SaleRow;
};

export const voidSale = async (saleId: string, reason: string): Promise<SaleRow> => {
  const { data, error } = await supabase.rpc('void_sale', {
    p_sale_id: saleId,
    p_reason: reason,
  });

  if (error) throw toApiError(error, 'Unable to void the purchase.');
  return data as SaleRow;
};
