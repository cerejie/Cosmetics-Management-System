/**
 * Hand-maintained mirror of the Postgres schema in supabase/migrations.
 * Regenerate with `supabase gen types typescript` once the CLI is wired up.
 */

export type AppRole = 'superadmin' | 'admin' | 'employee';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type StockMovementType =
  | 'purchase'
  | 'adjustment'
  | 'sale'
  | 'sale_reversal'
  | 'purchase_return';
export type SaleStatus = 'completed' | 'voided';
export type PaymentMethod = 'cash' | 'card' | 'gcash' | 'bank_transfer';

export interface UserRow {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly full_name: string;
  readonly role: AppRole;
  readonly is_active: boolean;
  readonly approval_status: ApprovalStatus;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CategoryRow {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ProductRow {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly brand: string;
  readonly category_id: string | null;
  readonly cost_price: number;
  readonly unit_price: number;
  readonly stock_quantity: number;
  readonly reorder_level: number;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface StockMovementRow {
  readonly id: string;
  readonly product_id: string;
  readonly type: StockMovementType;
  readonly quantity: number;
  readonly quantity_after: number;
  readonly reason: string;
  readonly reference_id: string | null;
  readonly created_by: string | null;
  readonly created_at: string;
}

export interface SaleRow {
  readonly id: string;
  readonly reference: string;
  readonly customer_name: string;
  readonly status: SaleStatus;
  readonly payment_method: PaymentMethod;
  readonly subtotal: number;
  readonly discount_amount: number;
  readonly total: number;
  readonly note: string;
  readonly created_by: string | null;
  readonly created_at: string;
  readonly voided_at: string | null;
  readonly voided_by: string | null;
}

export interface SaleItemRow {
  readonly id: string;
  readonly sale_id: string;
  readonly product_id: string;
  readonly product_name: string;
  readonly sku: string;
  readonly unit_price: number;
  readonly quantity: number;
  readonly line_total: number;
}

export interface SupplierRow {
  readonly id: string;
  readonly name: string;
  readonly contact_person: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly note: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PurchaseRow {
  readonly id: string;
  readonly reference: string;
  readonly supplier_id: string;
  readonly purchase_date: string;
  readonly total: number;
  readonly note: string;
  readonly created_by: string | null;
  readonly created_at: string;
}

export interface PurchaseItemRow {
  readonly id: string;
  readonly purchase_id: string;
  readonly product_id: string;
  readonly product_name: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unit_cost: number;
  readonly line_total: number;
}

export interface PurchaseReturnRow {
  readonly id: string;
  readonly reference: string;
  readonly supplier_id: string;
  readonly product_id: string;
  readonly product_name: string;
  readonly sku: string;
  readonly return_date: string;
  readonly quantity: number;
  readonly unit_cost: number;
  readonly total_amount: number;
  readonly reason: string;
  readonly created_by: string | null;
  readonly created_at: string;
}
