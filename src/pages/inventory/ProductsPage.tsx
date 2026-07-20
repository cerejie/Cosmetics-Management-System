import { Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { ProductFilters } from '@/components/inventory/inputs/ProductFilters';
import { ProductTable } from '@/components/inventory/tables/ProductTable';
import { ProductFormModal } from '@/components/inventory/modals/ProductFormModal';
import { StockAdjustmentModal } from '@/components/inventory/modals/StockAdjustmentModal';
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
  const openCreateForm = useProductStore((state) => state.openCreateForm);
  const openEditForm = useProductStore((state) => state.openEditForm);
  const openStockAdjustment = useProductStore((state) => state.openStockAdjustment);
  const deleteProduct = useProductStore((state) => state.deleteProduct);
  const loadCategories = useCategoryStore((state) => state.loadCategories);
  const { isAdmin } = useAuth();
  const runAction = useAsyncAction();

  useMountEffect(() => {
    void loadProducts();
    void loadCategories();
  });

  const handleDelete = (product: Product): void => {
    void runAction(() => deleteProduct(product.id), `${product.name} deleted.`);
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadProducts()} />;
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Your catalogue and current stock levels."
        extra={
          isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
              New product
            </Button>
          )
        }
      />

      <Card variant="outlined">
        <ProductFilters />
        <ProductTable
          products={products}
          loading={loading}
          canManage={isAdmin}
          onEdit={openEditForm}
          onAdjustStock={openStockAdjustment}
          onDelete={handleDelete}
        />
      </Card>

      <ProductFormModal />
      <StockAdjustmentModal />
    </>
  );
};
