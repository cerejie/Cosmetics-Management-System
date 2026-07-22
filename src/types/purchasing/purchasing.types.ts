import type {
  DiscountTypeValue,
  PurchaseItemRow,
  PurchaseReturnRow,
  PurchaseRow,
  SupplierRow,
} from '@/types/common/database.types';

/** How the supplier is being paid. Mirrors the CHECK on `purchases`. */
export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'gcash', 'credit'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Readonly<Record<PaymentMethod, string>> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
  gcash: 'GCash',
  credit: 'Credit',
};

/** Terms offered in the picker. A supplier's own wording is added to these. */
export const PAYMENT_TERMS_OPTIONS = [
  'Due on receipt',
  'Net 7',
  'Net 15',
  'Net 30',
  'Net 60',
  'Cash on delivery',
] as const;

export const paymentMethodLabel = (method: string): string =>
  (PAYMENT_METHOD_LABELS as Record<string, string>)[method] ?? '';

export interface Supplier {
  readonly id: string;
  readonly name: string;
  readonly contactPerson: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  /** Printed on purchase invoices and supplier statements. */
  readonly tin: string;
  readonly paymentTerms: string;
  readonly note: string;
  readonly createdAt: string;
}

export interface PurchaseItem {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly discountType: DiscountTypeValue;
  readonly discountValue: number;
  /** Pesos taken off this line. Derived by `create_purchase`, never by us. */
  readonly discountAmount: number;
  /** Net of the line discount, so the lines still sum to `subtotal`. */
  readonly lineTotal: number;
}

export interface Purchase {
  readonly id: string;
  readonly reference: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly purchaseDate: string;
  /** The supplier's own invoice number, as printed on their document. */
  readonly invoiceNumber: string;
  /** Delivery receipt or any other number the shop wants to keep. */
  readonly referenceNo: string;
  readonly paymentMethod: string;
  /** Snapshot of the supplier's terms — see the note on `sales` customers. */
  readonly paymentTerms: string;
  readonly subtotal: number;
  readonly discountType: DiscountTypeValue;
  readonly discountValue: number;
  readonly discountAmount: number;
  readonly total: number;
  readonly note: string;
  readonly createdAt: string;
  readonly createdByName: string | null;
  readonly items: readonly PurchaseItem[];
}

export interface PurchaseReturn {
  readonly id: string;
  readonly reference: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly returnDate: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly totalAmount: number;
  readonly reason: string;
  readonly createdByName: string | null;
}

/**
 * A line being typed into the purchase form. `productId` is null until a
 * product is picked, so a blank row can sit in the table before it is valid.
 */
export interface PurchaseDraftLine {
  readonly key: string;
  readonly productId: string | null;
  readonly quantity: number;
  readonly unitCost: number;
  readonly discountType: DiscountTypeValue;
  readonly discountValue: number;
}

/** The header being typed on the New Purchase screen, minus the lines. */
export interface PurchaseDraftHeader {
  readonly supplierId: string | null;
  readonly purchaseDate: string;
  readonly invoiceNumber: string;
  readonly referenceNo: string;
  readonly paymentMethod: string;
  readonly paymentTerms: string;
  readonly discountType: DiscountTypeValue;
  readonly discountValue: number;
  readonly note: string;
}

export type PurchaseRowWithRelations = PurchaseRow & {
  readonly purchase_items: readonly PurchaseItemRow[] | null;
  readonly suppliers: { readonly name: string } | null;
  readonly created_by_user: { readonly full_name: string } | null;
};

export type PurchaseReturnRowWithRelations = PurchaseReturnRow & {
  readonly suppliers: { readonly name: string } | null;
  readonly created_by_user: { readonly full_name: string } | null;
};

export const toSupplier = (row: SupplierRow): Supplier => ({
  id: row.id,
  name: row.name,
  contactPerson: row.contact_person,
  phone: row.phone,
  email: row.email,
  address: row.address,
  tin: row.tin,
  paymentTerms: row.payment_terms,
  note: row.note,
  createdAt: row.created_at,
});

export const toPurchaseItem = (row: PurchaseItemRow): PurchaseItem => ({
  id: row.id,
  productId: row.product_id,
  productName: row.product_name,
  sku: row.sku,
  quantity: row.quantity,
  unitCost: Number(row.unit_cost),
  discountType: row.discount_type,
  discountValue: Number(row.discount_value),
  discountAmount: Number(row.discount_amount),
  lineTotal: Number(row.line_total),
});

export const toPurchase = (row: PurchaseRowWithRelations): Purchase => ({
  id: row.id,
  reference: row.reference,
  supplierId: row.supplier_id,
  supplierName: row.suppliers?.name ?? 'Unknown supplier',
  purchaseDate: row.purchase_date,
  invoiceNumber: row.invoice_number,
  referenceNo: row.reference_no,
  paymentMethod: row.payment_method,
  paymentTerms: row.payment_terms,
  subtotal: Number(row.subtotal),
  discountType: row.discount_type,
  discountValue: Number(row.discount_value),
  discountAmount: Number(row.discount_amount),
  total: Number(row.total),
  note: row.note,
  createdAt: row.created_at,
  createdByName: row.created_by_user?.full_name || null,
  items: (row.purchase_items ?? []).map(toPurchaseItem),
});

export const toPurchaseReturn = (row: PurchaseReturnRowWithRelations): PurchaseReturn => ({
  id: row.id,
  reference: row.reference,
  supplierId: row.supplier_id,
  supplierName: row.suppliers?.name ?? 'Unknown supplier',
  productId: row.product_id,
  productName: row.product_name,
  sku: row.sku,
  returnDate: row.return_date,
  quantity: row.quantity,
  unitCost: Number(row.unit_cost),
  totalAmount: Number(row.total_amount),
  reason: row.reason,
  createdByName: row.created_by_user?.full_name || null,
});
