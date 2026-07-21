import * as suppliersApi from '@/api/purchasing/suppliers.api';
import { toSupplier, type Supplier } from '@/types/purchasing/purchasing.types';
import type { SupplierFormValues } from '@/schemas/purchasing/supplier.schema';

export const listSuppliers = async (): Promise<readonly Supplier[]> =>
  (await suppliersApi.fetchSuppliers()).map(toSupplier);

/** `id` null creates, otherwise updates. */
export const saveSupplier = async (
  id: string | null,
  values: SupplierFormValues,
): Promise<void> => {
  const payload = {
    name: values.name.trim(),
    contactPerson: values.contactPerson.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    address: values.address.trim(),
    tin: values.tin.trim(),
    paymentTerms: values.paymentTerms.trim(),
    note: values.note.trim(),
  };

  if (id === null) {
    await suppliersApi.createSupplier(payload);
    return;
  }

  await suppliersApi.updateSupplier(id, payload);
};

export const deleteSupplier = (id: string): Promise<void> => suppliersApi.deleteSupplier(id);
