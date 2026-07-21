import { useMemo } from 'react';
import { useCustomerStore } from '@/store/sales/customerStore';
import { hasCustomerDetails, type Customer } from '@/types/sales/customers.types';

interface FilteredCustomers {
  readonly customers: readonly Customer[];
  readonly loading: boolean;
  readonly incompleteCount: number;
}

export const useFilteredCustomers = (): FilteredCustomers => {
  const customers = useCustomerStore((state) => state.customers);
  const status = useCustomerStore((state) => state.status);
  const search = useCustomerStore((state) => state.search);
  const incompleteOnly = useCustomerStore((state) => state.incompleteOnly);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return customers.filter((customer) => {
      if (incompleteOnly && hasCustomerDetails(customer)) return false;
      if (!term) return true;

      return (
        customer.name.toLowerCase().includes(term) ||
        customer.contactNumber.toLowerCase().includes(term) ||
        customer.tin.toLowerCase().includes(term)
      );
    });
  }, [customers, search, incompleteOnly]);

  const incompleteCount = useMemo(
    () => customers.filter((customer) => !hasCustomerDetails(customer)).length,
    [customers],
  );

  return { customers: filtered, loading: status === 'loading', incompleteCount };
};
