import { useMemo } from 'react';
import { Button, Card, Flex, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { PurchasingTabs } from '@/components/purchasing/layout/PurchasingTabs';
import { PurchaseReturnTable } from '@/components/purchasing/tables/PurchaseReturnTable';
import { PurchaseReturnFormModal } from '@/components/purchasing/modals/PurchaseReturnFormModal';
import { usePurchaseReturnStore } from '@/store/purchasing/purchaseReturnStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useProductStore } from '@/store/inventory/productStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';

export const PurchaseReturnsPage = (): JSX.Element => {
  const returns = usePurchaseReturnStore((state) => state.returns);
  const status = usePurchaseReturnStore((state) => state.status);
  const error = usePurchaseReturnStore((state) => state.error);
  const search = usePurchaseReturnStore((state) => state.search);
  const setSearch = usePurchaseReturnStore((state) => state.setSearch);
  const loadReturns = usePurchaseReturnStore((state) => state.loadReturns);
  const openForm = usePurchaseReturnStore((state) => state.openForm);
  const loadSuppliers = useSupplierStore((state) => state.loadSuppliers);
  const loadProducts = useProductStore((state) => state.loadProducts);

  useMountEffect(() => {
    void loadReturns();
    // Both feed the "record a return" modal.
    void loadSuppliers();
    void loadProducts();
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term === '') return returns;

    return returns.filter(
      (item) =>
        item.reference.toLowerCase().includes(term) ||
        item.supplierName.toLowerCase().includes(term) ||
        item.productName.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term),
    );
  }, [returns, search]);

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadReturns()} />;
  }

  return (
    <>
      <PageHeader
        title="Purchasing"
        description="Goods you have sent back to a supplier."
        extra={
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openForm}>
            Add return
          </Button>
        }
      />

      <PurchasingTabs />

      <Card variant="outlined">
        <Flex style={{ marginBottom: 16 }}>
          <Input
            size="large"
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search by supplier or product"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 360 }}
          />
        </Flex>

        <PurchaseReturnTable returns={filtered} loading={status === 'loading'} />
      </Card>

      <PurchaseReturnFormModal />
    </>
  );
};
