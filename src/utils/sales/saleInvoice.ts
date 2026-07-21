import { invoiceFooter, invoiceTerms, toIssuerParty } from '@/utils/common/invoiceParties';
import { formatDateTime } from '@/utils/common/format';
import type { InvoiceDocument, InvoiceTotal } from '@/types/common/invoice.types';
import type { Sale } from '@/types/sales/sales.types';
import type { StoreProfile } from '@/types/settings/settings.types';
import { PAYMENT_METHOD_LABELS } from '@/config/constants';

/** The customer's receipt. Figures come straight off the recorded sale. */
export const toSaleInvoice = (sale: Sale, profile: StoreProfile | null): InvoiceDocument => {
  const totals: InvoiceTotal[] = [
    { label: 'Subtotal', amount: sale.subtotal },
    { label: 'Discount', amount: sale.discountAmount, negative: sale.discountAmount > 0 },
    { label: 'Tax', amount: 0 },
    { label: 'Total', amount: sale.total, emphasis: true },
  ];

  return {
    title: 'INVOICE',
    referenceLabel: 'Invoice Number',
    reference: sale.reference,
    date: formatDateTime(sale.createdAt),
    issuer: toIssuerParty(profile),
    recipientLabel: 'Bill to:',
    recipient: {
      name: sale.customerName.trim() || 'Walk-in customer',
      lines: [
        { value: sale.customerContact },
        { label: 'TIN', value: sale.customerTin },
        { label: 'Payment', value: PAYMENT_METHOD_LABELS[sale.paymentMethod] },
      ],
    },
    unitPriceLabel: 'Rate',
    lines: sale.items.map((item) => ({
      key: item.id,
      description: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      tax: 0,
      amount: item.lineTotal,
    })),
    totals,
    note: sale.note,
    terms: invoiceTerms(profile),
    footer: invoiceFooter(profile),
    preparedBy: sale.createdByName ? `Served by ${sale.createdByName}` : '',
    watermark: sale.status === 'voided' ? 'VOIDED' : '',
  };
};
