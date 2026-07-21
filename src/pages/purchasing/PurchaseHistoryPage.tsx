import { Card } from 'antd';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { PurchasingTabs } from '@/components/purchasing/layout/PurchasingTabs';
import { PurchaseFilters } from '@/components/purchasing/inputs/PurchaseFilters';
import { PurchaseHistoryTable } from '@/components/purchasing/tables/PurchaseHistoryTable';
import { PurchaseDetailModal } from '@/components/purchasing/modals/PurchaseDetailModal';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useFilteredPurchases } from '@/hooks/purchasing/usePurchases';
import { useMountEffect } from '@/hooks/common/useMountEffect';

export const PurchaseHistoryPage = (): JSX.Element => {
  const { purchases, loading } = useFilteredPurchases();
  const error = usePurchaseStore((state) => state.error);
  const loadPurchases = usePurchaseStore((state) => state.loadPurchases);
  const openDetail = usePurchaseStore((state) => state.openDetail);
  const loadSuppliers = useSupplierStore((state) => state.loadSuppliers);
  const loadProducts = useProductStore((state) => state.loadProducts);
  const loadCategories = useCategoryStore((state) => state.loadCategories);

  useMountEffect(() => {
    void loadPurchases();
    void loadSuppliers();
    // Products and categories drive the product and category filters.
    void loadProducts();
    void loadCategories();
  });

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadPurchases()} />;
  }

  return (
    <>
      <PageHeader title="Purchasing" description="Everything you have bought, most recent first." />

      <PurchasingTabs />

      <Card variant="outlined">
        <PurchaseFilters />
        <PurchaseHistoryTable purchases={purchases} loading={loading} onView={openDetail} />
      </Card>

      <PurchaseDetailModal />
    </>
  );
};
