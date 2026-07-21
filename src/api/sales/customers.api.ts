import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { CustomerRow } from '@/types/common/database.types';

export const fetchCustomers = async (): Promise<readonly CustomerRow[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true })
    .returns<CustomerRow[]>();

  if (error) throw toApiError(error, 'Unable to load customers.');
  return data ?? [];
};

export interface SaveCustomerPayload {
  readonly name: string;
  readonly contactPerson: string;
  readonly contactNumber: string;
  readonly tin: string;
  readonly address: string;
  readonly email: string;
  readonly note: string;
}

const toRow = (payload: SaveCustomerPayload) => ({
  name: payload.name,
  contact_person: payload.contactPerson,
  contact_number: payload.contactNumber,
  tin: payload.tin,
  address: payload.address,
  email: payload.email,
  note: payload.note,
});

export const createCustomer = async (payload: SaveCustomerPayload): Promise<CustomerRow> => {
  const { data, error } = await supabase
    .from('customers')
    .insert(toRow(payload))
    .select('*')
    .single<CustomerRow>();

  if (error) throw toApiError(error, 'Unable to add the customer.');
  return data;
};

export const updateCustomer = async (
  id: string,
  payload: SaveCustomerPayload,
): Promise<CustomerRow> => {
  const { data, error } = await supabase
    .from('customers')
    .update(toRow(payload))
    .eq('id', id)
    .select('*')
    .single<CustomerRow>();

  if (error) throw toApiError(error, 'Unable to save the customer.');
  return data;
};

/**
 * Sales point at customers with `on delete set null`, so removing one keeps
 * every past sale readable — it just stops being linked.
 */
export const deleteCustomer = async (id: string): Promise<void> => {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw toApiError(error, 'Unable to delete the customer.');
};
