import { Card } from 'antd';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { PurchasingTabs } from '@/components/purchasing/layout/PurchasingTabs';
import { PurchaseFilters } from '@/components/purchasing/inputs/PurchaseFilters';
import { PurchaseHistoryTable } from '@/components/purchasing/tables/PurchaseHistoryTable';
import { PurchaseDetailModal } from '@/components/purchasing/modals/PurchaseDetailModal';
import { PurchaseEditModal } from '@/components/purchasing/modals/PurchaseEditModal';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useStoreProfileStore } from '@/store/settings/storeProfileStore';
import { useFilteredPurchases } from '@/hooks/purchasing/usePurchases';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useAuth } from '@/hooks/auth/useAuth';
import { printInvoice } from '@/utils/common/invoiceHtml';
import { toPurchaseInvoice } from '@/utils/purchasing/purchaseInvoice';
import type { Purchase } from '@/types/purchasing/purchasing.types';

export const PurchaseHistoryPage = (): JSX.Element => {
  const { purchases, loading } = useFilteredPurchases();
  const error = usePurchaseStore((state) => state.error);
  const loadPurchases = usePurchaseStore((state) => state.loadPurchases);
  const openDetail = usePurchaseStore((state) => state.openDetail);
  const openEdit = usePurchaseStore((state) => state.openEdit);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const loadSuppliers = useSupplierStore((state) => state.loadSuppliers);
  const loadProducts = useProductStore((state) => state.loadProducts);
  const loadCategories = useCategoryStore((state) => state.loadCategories);
  const profile = useStoreProfileStore((state) => state.profile);
  const ensureProfile = useStoreProfileStore((state) => state.ensureProfile);
  const { isAdmin } = useAuth();

  useMountEffect(() => {
    void loadPurchases();
    // Suppliers do double duty: the filter, and the invoice's supplier block.
    void loadSuppliers();
    // Products and categories drive the product and category filters.
    void loadProducts();
    void loadCategories();
    void ensureProfile();
  });

  const handlePrint = (purchase: Purchase): void => {
    const supplier = suppliers.find((candidate) => candidate.id === purchase.supplierId) ?? null;
    printInvoice(toPurchaseInvoice(purchase, supplier, profile));
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadPurchases()} />;
  }

  return (
    <>
      <PageHeader title="Purchasing" description="Everything you have bought, most recent first." />

      <PurchasingTabs />

      <Card variant="outlined">
        <PurchaseFilters />
        <PurchaseHistoryTable
          purchases={purchases}
          loading={loading}
          canManage={isAdmin}
          onView={openDetail}
          onPrint={handlePrint}
          onEdit={(purchase) => void openEdit(purchase)}
        />
      </Card>

      <PurchaseDetailModal />
      <PurchaseEditModal />
    </>
  );
};
