import { useMemo } from 'react';
import { useCustomerStore } from '@/store/sales/customerStore';
import type { Customer } from '@/types/sales/customers.types';

export interface CustomerSuggestion {
  /** AutoComplete matches on `value`, so it is the customer's name. */
  readonly value: string;
  readonly label: string;
  readonly customer: Customer;
}

/**
 * Customers on file, for the checkout name box. It stays an AutoComplete
 * rather than a Select because a first-time customer is typed in freely —
 * `create_sale` adds them to the list on the way through.
 */
export const useCustomerSuggestions = (): readonly CustomerSuggestion[] => {
  const customers = useCustomerStore((state) => state.customers);

  return useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.name,
        label: customer.contactNumber
          ? `${customer.name} · ${customer.contactNumber}`
          : customer.name,
        customer,
      })),
    [customers],
  );
};
