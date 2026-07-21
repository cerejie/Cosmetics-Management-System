import type {
  PurchaseItemRow,
  PurchaseReturnRow,
  PurchaseRow,
  SupplierRow,
} from '@/types/common/database.types';

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
  readonly lineTotal: number;
}

export interface Purchase {
  readonly id: string;
  readonly reference: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly purchaseDate: string;
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
  lineTotal: Number(row.line_total),
});

export const toPurchase = (row: PurchaseRowWithRelations): Purchase => ({
  id: row.id,
  reference: row.reference,
  supplierId: row.supplier_id,
  supplierName: row.suppliers?.name ?? 'Unknown supplier',
  purchaseDate: row.purchase_date,
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
