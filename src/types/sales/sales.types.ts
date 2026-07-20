import type {
  PaymentMethod,
  SaleItemRow,
  SaleRow,
  SaleStatus,
} from '@/types/common/database.types';

export type { PaymentMethod, SaleStatus };

export interface SaleItem {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly lineTotal: number;
}

export interface Sale {
  readonly id: string;
  readonly reference: string;
  readonly customerName: string;
  readonly status: SaleStatus;
  readonly paymentMethod: PaymentMethod;
  readonly subtotal: number;
  readonly discountAmount: number;
  readonly total: number;
  readonly note: string;
  readonly createdAt: string;
  readonly createdByName: string | null;
  readonly items: readonly SaleItem[];
}

/** A line being composed in the cart, before the sale is submitted. */
export interface CartLine {
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly availableStock: number;
}

export type SaleRowWithRelations = SaleRow & {
  readonly sale_items: readonly SaleItemRow[] | null;
  readonly created_by_profile: { readonly full_name: string } | null;
};

export const toSaleItem = (row: SaleItemRow): SaleItem => ({
  id: row.id,
  productId: row.product_id,
  productName: row.product_name,
  sku: row.sku,
  unitPrice: Number(row.unit_price),
  quantity: row.quantity,
  lineTotal: Number(row.line_total),
});

export const toSale = (row: SaleRowWithRelations): Sale => ({
  id: row.id,
  reference: row.reference,
  customerName: row.customer_name,
  status: row.status,
  paymentMethod: row.payment_method,
  subtotal: Number(row.subtotal),
  discountAmount: Number(row.discount_amount),
  total: Number(row.total),
  note: row.note,
  createdAt: row.created_at,
  createdByName: row.created_by_profile?.full_name || null,
  items: (row.sale_items ?? []).map(toSaleItem),
});

export const getCartSubtotal = (lines: readonly CartLine[]): number =>
  lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
