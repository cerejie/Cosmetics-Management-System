import { Button, Card, Flex, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { PurchasingTabs } from '@/components/purchasing/layout/PurchasingTabs';
import { SupplierTable } from '@/components/purchasing/tables/SupplierTable';
import { SupplierFormModal } from '@/components/purchasing/modals/SupplierFormModal';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useFilteredSuppliers } from '@/hooks/purchasing/usePurchases';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import type { Supplier } from '@/types/purchasing/purchasing.types';

export const SuppliersPage = (): JSX.Element => {
  const suppliers = useFilteredSuppliers();
  const status = useSupplierStore((state) => state.status);
  const error = useSupplierStore((state) => state.error);
  const search = useSupplierStore((state) => state.search);
  const setSearch = useSupplierStore((state) => state.setSearch);
  const loadSuppliers = useSupplierStore((state) => state.loadSuppliers);
  const openCreateForm = useSupplierStore((state) => state.openCreateForm);
  const openEditForm = useSupplierStore((state) => state.openEditForm);
  const deleteSupplier = useSupplierStore((state) => state.deleteSupplier);
  const runAction = useAsyncAction();

  useMountEffect(() => {
    void loadSuppliers();
  });

  const handleDelete = (supplier: Supplier): void => {
    void runAction(() => deleteSupplier(supplier.id), `${supplier.name} deleted.`);
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadSuppliers()} />;
  }

  return (
    <>
      <PageHeader
        title="Purchasing"
        description="The businesses you buy your stock from."
        extra={
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreateForm}>
            Add supplier
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
            placeholder="Search suppliers"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 360 }}
          />
        </Flex>

        <SupplierTable
          suppliers={suppliers}
          loading={status === 'loading'}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      </Card>

      <SupplierFormModal />
    </>
  );
};
