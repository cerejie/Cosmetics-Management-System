import { App, Card } from 'antd';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { ProductFilters } from '@/components/inventory/inputs/ProductFilters';
import { ProductTable } from '@/components/inventory/tables/ProductTable';
import { ProductFormModal } from '@/components/inventory/modals/ProductFormModal';
import { ForceDeleteProductModal } from '@/components/inventory/modals/ForceDeleteProductModal';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useFilteredProducts } from '@/hooks/inventory/useProducts';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { useAuth } from '@/hooks/auth/useAuth';
import type { Product } from '@/types/inventory/inventory.types';

export const ProductsPage = (): JSX.Element => {
  const { products, loading } = useFilteredProducts();
  const error = useProductStore((state) => state.error);
  const loadProducts = useProductStore((state) => state.loadProducts);
  const openEditForm = useProductStore((state) => state.openEditForm);
  const deleteProduct = useProductStore((state) => state.deleteProduct);
  const openForceDelete = useProductStore((state) => state.openForceDelete);
  const loadCategories = useCategoryStore((state) => state.loadCategories);
  const { isAdmin } = useAuth();
  const runAction = useAsyncAction();
  const { message } = App.useApp();

  useMountEffect(() => {
    void loadProducts();
    void loadCategories();
  });

  // The message depends on what the database decided, so it is built from the
  // result rather than passed to runAction up front.
  const handleDelete = (product: Product): void => {
    void (async () => {
      const result = await runAction(() => deleteProduct(product.id));
      if (!result.ok) return;

      if (result.data === 'archived') {
        message.info(
          `${product.name} appears in past records, so it was marked inactive instead of deleted.`,
        );
        return;
      }

      message.success(`${product.name} deleted.`);
    })();
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadProducts()} />;
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Your product list. New products are added when you record a purchase."
      />

      <Card variant="outlined">
        <ProductFilters />
        <ProductTable
          products={products}
          loading={loading}
          canManage={isAdmin}
          onEdit={openEditForm}
          onDelete={handleDelete}
          onForceDelete={(product) => void openForceDelete(product)}
        />
      </Card>

      <ProductFormModal />
      <ForceDeleteProductModal />
    </>
  );
};
