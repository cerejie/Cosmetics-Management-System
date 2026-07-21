import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { SupplierRow } from '@/types/common/database.types';

export const fetchSuppliers = async (): Promise<readonly SupplierRow[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true })
    .returns<SupplierRow[]>();

  if (error) throw toApiError(error, 'Unable to load suppliers.');
  return data ?? [];
};

export interface SaveSupplierPayload {
  readonly name: string;
  readonly contactPerson: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly note: string;
}

const toRow = (payload: SaveSupplierPayload) => ({
  name: payload.name,
  contact_person: payload.contactPerson,
  phone: payload.phone,
  email: payload.email,
  address: payload.address,
  note: payload.note,
});

export const createSupplier = async (payload: SaveSupplierPayload): Promise<SupplierRow> => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(toRow(payload))
    .select('*')
    .single<SupplierRow>();

  if (error) throw toApiError(error, 'Unable to add the supplier.');
  return data;
};

export const updateSupplier = async (
  id: string,
  payload: SaveSupplierPayload,
): Promise<SupplierRow> => {
  const { data, error } = await supabase
    .from('suppliers')
    .update(toRow(payload))
    .eq('id', id)
    .select('*')
    .single<SupplierRow>();

  if (error) throw toApiError(error, 'Unable to save the supplier.');
  return data;
};

/**
 * Blocked by the database (`on delete restrict`) once the supplier appears on a
 * purchase, which is what keeps old records readable.
 */
export const deleteSupplier = async (id: string): Promise<void> => {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) {
    throw toApiError(
      error,
      'This supplier is used by a purchase, so it cannot be deleted.',
    );
  }
};
