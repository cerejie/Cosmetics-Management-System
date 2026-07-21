import { useMemo } from 'react';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useProductStore } from '@/store/inventory/productStore';
import type { Purchase, Supplier } from '@/types/purchasing/purchasing.types';

interface FilteredPurchases {
  readonly purchases: readonly Purchase[];
  readonly loading: boolean;
}

/**
 * Purchase history, narrowed by date, supplier, product category and a free
 * text search that also looks inside the purchased lines — so searching a
 * product name finds every delivery that contained it.
 */
export const useFilteredPurchases = (): FilteredPurchases => {
  const purchases = usePurchaseStore((state) => state.purchases);
  const status = usePurchaseStore((state) => state.status);
  const search = usePurchaseStore((state) => state.search);
  const supplierFilter = usePurchaseStore((state) => state.supplierFilter);
  const categoryFilter = usePurchaseStore((state) => state.categoryFilter);
  const dateRange = usePurchaseStore((state) => state.dateRange);
  const products = useProductStore((state) => state.products);

  const categoryByProduct = useMemo(
    () => new Map(products.map((product) => [product.id, product.categoryId])),
    [products],
  );

  return useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = purchases.filter((purchase) => {
      if (supplierFilter !== null && purchase.supplierId !== supplierFilter) return false;

      if (dateRange !== null) {
        const [from, to] = dateRange;
        if (purchase.purchaseDate < from || purchase.purchaseDate > to) return false;
      }

      if (
        categoryFilter !== null &&
        !purchase.items.some((item) => categoryByProduct.get(item.productId) === categoryFilter)
      ) {
        return false;
      }

      if (term !== '') {
        const matches =
          purchase.reference.toLowerCase().includes(term) ||
          purchase.supplierName.toLowerCase().includes(term) ||
          purchase.items.some(
            (item) =>
              item.productName.toLowerCase().includes(term) ||
              item.sku.toLowerCase().includes(term),
          );

        if (!matches) return false;
      }

      return true;
    });

    return { purchases: filtered, loading: status === 'loading' };
  }, [purchases, status, search, supplierFilter, categoryFilter, dateRange, categoryByProduct]);
};

export const useFilteredSuppliers = (): readonly Supplier[] => {
  const suppliers = useSupplierStore((state) => state.suppliers);
  const search = useSupplierStore((state) => state.search);

  return useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term === '') return suppliers;

    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(term) ||
        supplier.contactPerson.toLowerCase().includes(term) ||
        supplier.phone.toLowerCase().includes(term) ||
        supplier.email.toLowerCase().includes(term),
    );
  }, [suppliers, search]);
};
