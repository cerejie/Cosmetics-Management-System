import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { DiscountTypeValue, PurchaseRow } from '@/types/common/database.types';
import type { PurchaseRowWithRelations } from '@/types/purchasing/purchasing.types';

const PURCHASE_SELECT = `
  *,
  purchase_items ( * ),
  suppliers ( name ),
  created_by_user:users!purchases_created_by_fkey ( full_name )
`;

export const fetchPurchases = async (limit = 300): Promise<readonly PurchaseRowWithRelations[]> => {
  const { data, error } = await supabase
    .from('purchases')
    .select(PURCHASE_SELECT)
    .order('purchase_date', { ascending: false })
    .limit(limit)
    .returns<PurchaseRowWithRelations[]>();

  if (error) throw toApiError(error, 'Unable to load purchases.');
  return data ?? [];
};

export interface CreatePurchasePayload {
  readonly supplierId: string;
  readonly purchaseDate: string;
  readonly note: string;
  readonly invoiceNumber: string;
  readonly referenceNo: string;
  readonly paymentMethod: string;
  readonly paymentTerms: string;
  readonly discountType: DiscountTypeValue;
  readonly discountValue: number;
  readonly items: readonly {
    readonly product_id: string;
    readonly quantity: number;
    readonly unit_cost: number;
    readonly discount_type: DiscountTypeValue;
    readonly discount_value: number;
  }[];
}

/**
 * Records the purchase and adds the goods to inventory in one transaction. The
 * RPC recomputes every line total and both discounts, so the client sends only
 * quantities, unit costs and how each discount was expressed — never a peso
 * figure it worked out itself.
 */
export const createPurchase = async (payload: CreatePurchasePayload): Promise<PurchaseRow> => {
  const { data, error } = await supabase.rpc('create_purchase', {
    p_supplier_id: payload.supplierId,
    p_items: payload.items,
    p_purchase_date: payload.purchaseDate,
    p_note: payload.note,
    p_invoice_number: payload.invoiceNumber,
    p_reference_no: payload.referenceNo,
    p_payment_method: payload.paymentMethod,
    p_payment_terms: payload.paymentTerms,
    p_discount_type: payload.discountType,
    p_discount_value: payload.discountValue,
  });

  if (error) throw toApiError(error, 'Unable to save the purchase.');
  return data as PurchaseRow;
};
