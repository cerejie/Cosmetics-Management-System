import { PageHeader } from '@/components/common/feedback/PageHeader';
import { PurchasingTabs } from '@/components/purchasing/layout/PurchasingTabs';
import { PurchaseForm } from '@/components/purchasing/forms/PurchaseForm';
import { NewProductModal } from '@/components/purchasing/modals/NewProductModal';
import { SupplierFormModal } from '@/components/purchasing/modals/SupplierFormModal';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';

export const NewPurchasePage = (): JSX.Element => {
  const loadProducts = useProductStore((state) => state.loadProducts);
  const loadSuppliers = useSupplierStore((state) => state.loadSuppliers);
  const loadCategories = useCategoryStore((state) => state.loadCategories);
  const loadPurchases = usePurchaseStore((state) => state.loadPurchases);

  useMountEffect(() => {
    void loadProducts();
    void loadSuppliers();
    // Needed by the "add a new product" modal.
    void loadCategories();
    // The supplier card reports when they last delivered.
    void loadPurchases();
  });

  return (
    <>
      <PageHeader
        title="Purchasing"
        description="Record what you bought. Saving a purchase adds it to your stock."
      />

      <PurchasingTabs />

      <PurchaseForm />

      <NewProductModal />

      <SupplierFormModal />
    </>
  );
};
