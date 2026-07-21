import type { InvoiceParty } from '@/types/common/invoice.types';
import type { StoreProfile } from '@/types/settings/settings.types';

/**
 * The store's block, printed as "Bill from" on every document. The profile is
 * null until Settings → Store profile has been filled in, so the fallback keeps
 * an invoice printable rather than blocking on setup.
 */
export const toIssuerParty = (profile: StoreProfile | null): InvoiceParty => ({
  name: profile?.storeName.trim() || 'Your store',
  lines: [
    { value: profile?.legalName ?? '' },
    { value: profile?.address ?? '' },
    { value: profile?.contactNumber ?? '' },
    { value: profile?.email ?? '' },
    { label: 'TIN', value: profile?.tin ?? '' },
  ],
});

/** The closing line under the page. */
export const invoiceFooter = (profile: StoreProfile | null): string =>
  profile?.invoiceFooter.trim() ?? '';

const DEFAULT_TERMS =
  'Goods sold are checked and accepted on receipt. Please quote the invoice number for any query.';

/** Terms print opposite the totals; the store's own wording wins if it has any. */
export const invoiceTerms = (profile: StoreProfile | null): string =>
  profile?.invoiceFooter.trim() || DEFAULT_TERMS;
