import { useMemo } from 'react';
import { useSalesStore } from '@/store/sales/salesStore';

/**
 * Distinct customer names from previous sales, newest first. There is no
 * customers table — this only saves the cashier from retyping regulars.
 */
export const useCustomerSuggestions = (): readonly { readonly value: string }[] => {
  const sales = useSalesStore((state) => state.sales);

  return useMemo(() => {
    const names = new Set<string>();

    for (const sale of sales) {
      const name = sale.customerName.trim();
      if (name) names.add(name);
    }

    return [...names].map((value) => ({ value }));
  }, [sales]);
};
