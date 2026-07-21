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

/**
 * Reports ask for a period rather than the most recent N, so this one is
 * bounded by dates and not by a row count. `created_at` is a timestamptz and
 * the range is calendar days, so the bounds are the caller's local midnights.
 */
export const fetchSalesInRange = async (
  fromInstant: string,
  toInstant: string,
): Promise<readonly SaleRowWithRelations[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select(SALE_SELECT)
    .gte('created_at', fromInstant)
    .lte('created_at', toInstant)
    .order('created_at', { ascending: false })
    .returns<SaleRowWithRelations[]>();

  if (error) throw toApiError(error, 'Unable to load sales for that period.');
  return data ?? [];
};

export interface CreateSalePayload {
  readonly items: readonly { readonly product_id: string; readonly quantity: number }[];
  readonly customerName: string;
  readonly customerContact: string;
  readonly customerTin: string;
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
    p_customer_contact: payload.customerContact,
    p_customer_tin: payload.customerTin,
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
