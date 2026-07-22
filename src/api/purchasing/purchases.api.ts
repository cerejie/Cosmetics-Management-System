import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { DiscountTypeValue, PurchaseRow } from '@/types/common/database.types';
import type {
  PurchaseEditRowWithRelations,
  PurchaseRowWithRelations,
} from '@/types/purchasing/purchasing.types';

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

export interface UpdatePurchaseDetailsPayload {
  readonly id: string;
  readonly purchaseDate: string;
  readonly invoiceNumber: string;
  readonly referenceNo: string;
  readonly paymentMethod: string;
  readonly paymentTerms: string;
  readonly note: string;
}

/**
 * Corrects the supplier's paperwork on a purchase already recorded. Nothing
 * here touches stock, costs or totals — the RPC accepts no such argument — and
 * every field that actually moves is written to `purchase_edits`.
 */
export const updatePurchaseDetails = async (
  payload: UpdatePurchaseDetailsPayload,
): Promise<PurchaseRow> => {
  const { data, error } = await supabase.rpc('update_purchase_details', {
    p_id: payload.id,
    p_purchase_date: payload.purchaseDate,
    p_invoice_number: payload.invoiceNumber,
    p_reference_no: payload.referenceNo,
    p_payment_method: payload.paymentMethod,
    p_payment_terms: payload.paymentTerms,
    p_note: payload.note,
  });

  if (error) throw toApiError(error, 'Unable to save the changes.');
  return data as PurchaseRow;
};

/** The correction log for one purchase, most recent first. */
export const fetchPurchaseEdits = async (
  purchaseId: string,
): Promise<readonly PurchaseEditRowWithRelations[]> => {
  const { data, error } = await supabase
    .from('purchase_edits')
    .select('*, changed_by_user:users!purchase_edits_changed_by_fkey ( full_name )')
    .eq('purchase_id', purchaseId)
    .order('changed_at', { ascending: false })
    .returns<PurchaseEditRowWithRelations[]>();

  if (error) throw toApiError(error, 'Unable to load the update log.');
  return data ?? [];
};
