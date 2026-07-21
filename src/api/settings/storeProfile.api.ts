import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { StoreProfileRow } from '@/types/common/database.types';

/**
 * One row, guaranteed by a unique index on a constant expression, so `limit(1)`
 * is the whole query. Null only before the seed row exists.
 */
export const fetchStoreProfile = async (): Promise<StoreProfileRow | null> => {
  const { data, error } = await supabase
    .from('store_profile')
    .select('*')
    .limit(1)
    .maybeSingle<StoreProfileRow>();

  if (error) throw toApiError(error, 'Unable to load the store profile.');
  return data;
};

export interface SaveStoreProfilePayload {
  /** Null on the very first save, when the seed row is missing. */
  readonly id: string | null;
  readonly storeName: string;
  readonly legalName: string;
  readonly tin: string;
  readonly address: string;
  readonly contactNumber: string;
  readonly email: string;
  readonly website: string;
  readonly invoiceFooter: string;
}

const toRow = (payload: SaveStoreProfilePayload) => ({
  store_name: payload.storeName,
  legal_name: payload.legalName,
  tin: payload.tin,
  address: payload.address,
  contact_number: payload.contactNumber,
  email: payload.email,
  website: payload.website,
  invoice_footer: payload.invoiceFooter,
});

export const saveStoreProfile = async (
  payload: SaveStoreProfilePayload,
): Promise<StoreProfileRow> => {
  const query =
    payload.id === null
      ? supabase.from('store_profile').insert(toRow(payload))
      : supabase.from('store_profile').update(toRow(payload)).eq('id', payload.id);

  const { data, error } = await query.select('*').single<StoreProfileRow>();

  if (error) throw toApiError(error, 'Unable to save the store profile.');
  return data;
};
