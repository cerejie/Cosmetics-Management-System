import type { StoreProfileRow } from '@/types/common/database.types';

/** The store's own identity, printed at the top of every invoice. */
export interface StoreProfile {
  readonly id: string;
  readonly storeName: string;
  readonly legalName: string;
  readonly tin: string;
  readonly address: string;
  readonly contactNumber: string;
  readonly email: string;
  readonly website: string;
  readonly invoiceFooter: string;
  readonly updatedAt: string;
}

export const toStoreProfile = (row: StoreProfileRow): StoreProfile => ({
  id: row.id,
  storeName: row.store_name,
  legalName: row.legal_name,
  tin: row.tin,
  address: row.address,
  contactNumber: row.contact_number,
  email: row.email,
  website: row.website,
  invoiceFooter: row.invoice_footer,
  updatedAt: row.updated_at,
});
