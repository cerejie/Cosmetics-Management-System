import * as customersApi from '@/api/sales/customers.api';
import { toCustomer, type Customer } from '@/types/sales/customers.types';
import type { CustomerFormValues } from '@/schemas/sales/customer.schema';

export const listCustomers = async (): Promise<readonly Customer[]> =>
  (await customersApi.fetchCustomers()).map(toCustomer);

/** `id` null creates, otherwise updates. */
export const saveCustomer = async (
  id: string | null,
  values: CustomerFormValues,
): Promise<Customer> => {
  const payload = {
    name: values.name.trim(),
    contactPerson: values.contactPerson.trim(),
    contactNumber: values.contactNumber.trim(),
    tin: values.tin.trim(),
    address: values.address.trim(),
    email: values.email.trim(),
    note: values.note.trim(),
  };

  return toCustomer(
    id === null
      ? await customersApi.createCustomer(payload)
      : await customersApi.updateCustomer(id, payload),
  );
};

export const deleteCustomer = (id: string): Promise<void> => customersApi.deleteCustomer(id);
