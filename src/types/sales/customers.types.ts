import type { CustomerRow } from '@/types/common/database.types';

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly contactPerson: string;
  readonly contactNumber: string;
  readonly tin: string;
  readonly address: string;
  readonly email: string;
  readonly note: string;
  readonly createdAt: string;
}

/**
 * A customer created by `create_sale` has nothing but a name. The Customers
 * screen calls that out so the gap is obvious and fillable.
 */
export const hasCustomerDetails = (customer: Customer): boolean =>
  [
    customer.contactPerson,
    customer.contactNumber,
    customer.tin,
    customer.address,
    customer.email,
  ].some((field) => field.trim() !== '');

export const toCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  name: row.name,
  contactPerson: row.contact_person,
  contactNumber: row.contact_number,
  tin: row.tin,
  address: row.address,
  email: row.email,
  note: row.note,
  createdAt: row.created_at,
});
