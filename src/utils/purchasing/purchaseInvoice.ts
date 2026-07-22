import dayjs from 'dayjs';
import { invoiceFooter, invoiceTerms, toIssuerParty } from '@/utils/common/invoiceParties';
import { formatDate } from '@/utils/common/format';
import { describeRange, type DateRange } from '@/utils/reports/period';
import type { InvoiceDocument, InvoiceParty } from '@/types/common/invoice.types';
import { paymentMethodLabel } from '@/types/purchasing/purchasing.types';
import type { Purchase, Supplier } from '@/types/purchasing/purchasing.types';
import type { StoreProfile } from '@/types/settings/settings.types';

/**
 * `supplier` is the full record when it is loaded, so the printed document
 * carries the supplier's TIN; the purchase alone only knows a name.
 *
 * `purchase` is passed when the document is about one delivery. Its terms and
 * document numbers are read from the purchase rather than the supplier record,
 * because they were snapshotted at the time: correcting a supplier's standing
 * terms today must not change what an already-printed invoice says.
 */
const toSupplierParty = (
  supplierName: string,
  supplier: Supplier | null,
  purchase?: Purchase,
): InvoiceParty => ({
  name: supplier?.name ?? supplierName,
  lines: [
    { value: supplier?.contactPerson ?? '' },
    { value: supplier?.address ?? '' },
    { value: supplier?.phone ?? '' },
    { value: supplier?.email ?? '' },
    { label: 'TIN', value: supplier?.tin ?? '' },
    { label: 'Terms', value: purchase?.paymentTerms || supplier?.paymentTerms || '' },
    ...(purchase?.invoiceNumber
      ? [{ label: 'Supplier invoice', value: purchase.invoiceNumber }]
      : []),
    ...(purchase?.referenceNo ? [{ label: 'Reference', value: purchase.referenceNo }] : []),
    ...(purchase?.paymentMethod
      ? [{ label: 'Paid by', value: paymentMethodLabel(purchase.paymentMethod) }]
      : []),
  ],
});

/**
 * The goods-received document for one delivery.
 *
 * The reference is our own purchase order number. The supplier's invoice number
 * is their document, so it is printed as a detail of the order rather than as
 * the heading — two suppliers may well both have issued an "INV-001".
 */
export const toPurchaseInvoice = (
  purchase: Purchase,
  supplier: Supplier | null,
  profile: StoreProfile | null,
): InvoiceDocument => ({
  title: 'PURCHASE',
  referenceLabel: 'Purchase Order',
  reference: purchase.reference,
  date: formatDate(purchase.purchaseDate),
  issuer: toIssuerParty(profile),
  recipientLabel: 'Supplier:',
  recipient: toSupplierParty(purchase.supplierName, supplier, purchase),
  unitPriceLabel: 'Rate',
  lines: purchase.items.map((item) => ({
    key: item.id,
    description: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitCost,
    tax: 0,
    amount: item.lineTotal,
  })),
  totals: [
    { label: 'Subtotal', amount: purchase.subtotal },
    ...(purchase.discountAmount > 0
      ? [{ label: 'Discount', amount: purchase.discountAmount, negative: true }]
      : []),
    { label: 'Total', amount: purchase.total, emphasis: true },
  ],
  note: purchase.note,
  terms: invoiceTerms(profile),
  footer: invoiceFooter(profile),
  preparedBy: purchase.createdByName ? `Recorded by ${purchase.createdByName}` : '',
  watermark: '',
});

/** Every purchase from one supplier, oldest first. */
export const purchasesForSupplier = (
  supplierId: string,
  purchases: readonly Purchase[],
): readonly Purchase[] =>
  [...purchases]
    .filter((purchase) => purchase.supplierId === supplierId)
    .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));

/**
 * What the statement dialog opens on.
 *
 * The current month is the usual answer — that is the account being settled.
 * It is only widened to the supplier's whole history when they have nothing
 * this month, so an old account still prints something rather than a blank
 * page, and the user is free to change it either way.
 */
export const defaultStatementRange = (
  supplierId: string,
  purchases: readonly Purchase[],
): DateRange => {
  const now = dayjs();
  const thisMonth: DateRange = {
    from: now.startOf('month').format('YYYY-MM-DD'),
    to: now.endOf('month').format('YYYY-MM-DD'),
  };

  const mine = purchasesForSupplier(supplierId, purchases);
  const first = mine[0];
  const last = mine[mine.length - 1];

  if (!first || !last) return thisMonth;

  const hasThisMonth = mine.some(
    (purchase) => purchase.purchaseDate >= thisMonth.from && purchase.purchaseDate <= thisMonth.to,
  );

  return hasThisMonth ? thisMonth : { from: first.purchaseDate, to: last.purchaseDate };
};

/**
 * Every purchase from one supplier in a period, on a single sheet — what the
 * shop hands over when reconciling an account, so each line is a delivery
 * rather than a product.
 */
export const toSupplierStatement = (
  supplier: Supplier,
  purchases: readonly Purchase[],
  range: DateRange,
  profile: StoreProfile | null,
): InvoiceDocument => {
  const mine = purchasesForSupplier(supplier.id, purchases).filter(
    (purchase) => purchase.purchaseDate >= range.from && purchase.purchaseDate <= range.to,
  );
  const total = mine.reduce((sum, purchase) => sum + purchase.total, 0);

  return {
    title: 'STATEMENT',
    referenceLabel: 'Statement for',
    reference: supplier.name,
    date: describeRange(range),
    issuer: toIssuerParty(profile),
    recipientLabel: 'Supplier:',
    recipient: toSupplierParty(supplier.name, supplier),
    unitPriceLabel: 'Average cost',
    lines: mine.map((purchase) => {
      const quantity = purchase.items.reduce((count, item) => count + item.quantity, 0);

      return {
        key: purchase.id,
        description: `${purchase.reference} · ${formatDate(purchase.purchaseDate)}`,
        sku: purchase.note,
        quantity,
        // A delivery has no single unit cost, so the average keeps the column
        // meaningful instead of repeating the amount beside it.
        unitPrice: quantity > 0 ? purchase.total / quantity : 0,
        tax: 0,
        amount: purchase.total,
      };
    }),
    totals: [
      { label: 'Deliveries', amount: total },
      { label: 'Tax', amount: 0 },
      { label: 'Total purchased', amount: total, emphasis: true },
    ],
    note: supplier.note,
    terms: invoiceTerms(profile),
    footer: invoiceFooter(profile),
    preparedBy: '',
    watermark: '',
  };
};
