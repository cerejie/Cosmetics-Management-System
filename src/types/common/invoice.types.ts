/**
 * A printable document, independent of what it was built from. Sales, purchases
 * and supplier statements all reduce to this shape, so there is exactly one
 * renderer and one stylesheet to keep consistent.
 */

/** One side of the document — the store, a customer or a supplier. */
export interface InvoiceParty {
  readonly name: string;
  readonly lines: readonly InvoiceField[];
}

export interface InvoiceField {
  /**
   * Omitted for lines that read fine alone — an address or a phone number.
   * Kept for the ones that do not, so "TIN" is never a bare number.
   */
  readonly label?: string;
  readonly value: string;
}

export interface InvoiceLine {
  readonly key: string;
  readonly description: string;
  /** Small print under the description — a product code, or nothing. */
  readonly sku: string;
  readonly quantity: number;
  readonly unitPrice: number;
  /**
   * Carried so the printed layout keeps its Tax column. The shop does not
   * compute tax per line, so this is 0 until it does.
   */
  readonly tax: number;
  readonly amount: number;
}

/** A labelled figure in the block under the table. */
export interface InvoiceTotal {
  readonly label: string;
  readonly amount: number;
  /**
   * The one figure being asked for. It is lifted out of the list into the
   * solid bar at the foot of the page, so exactly one total should set it.
   */
  readonly emphasis?: boolean;
  /** Renders as a deduction. */
  readonly negative?: boolean;
}

export interface InvoiceDocument {
  /** e.g. "Sales Invoice". Printed above the reference. */
  readonly title: string;
  /** e.g. "Invoice Number" or "Statement for". */
  readonly referenceLabel: string;
  readonly reference: string;
  /** Already formatted for display. */
  readonly date: string;
  readonly issuer: InvoiceParty;
  /** "Sold to" on a sales invoice, "Supplier" on a purchase. */
  readonly recipientLabel: string;
  readonly recipient: InvoiceParty;
  /** Column heading for the quantity's unit price; varies by document. */
  readonly unitPriceLabel: string;
  readonly lines: readonly InvoiceLine[];
  readonly totals: readonly InvoiceTotal[];
  readonly note: string;
  /** Terms & conditions, printed opposite the totals block. */
  readonly terms: string;
  readonly footer: string;
  /** e.g. "Recorded by Maria Santos". */
  readonly preparedBy: string;
  /** Printed diagonally across the page, e.g. "VOIDED". */
  readonly watermark: string;
}
