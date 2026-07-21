import { Alert, Button, Card, Flex, Input, Switch, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { CustomerTable } from '@/components/sales/tables/CustomerTable';
import { CustomerFormModal } from '@/components/sales/modals/CustomerFormModal';
import { useCustomerStore } from '@/store/sales/customerStore';
import { useFilteredCustomers } from '@/hooks/sales/useCustomers';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { useAuth } from '@/hooks/auth/useAuth';
import type { Customer } from '@/types/sales/customers.types';

export const CustomersPage = (): JSX.Element => {
  const { customers, loading, incompleteCount } = useFilteredCustomers();
  const error = useCustomerStore((state) => state.error);
  const search = useCustomerStore((state) => state.search);
  const setSearch = useCustomerStore((state) => state.setSearch);
  const incompleteOnly = useCustomerStore((state) => state.incompleteOnly);
  const setIncompleteOnly = useCustomerStore((state) => state.setIncompleteOnly);
  const loadCustomers = useCustomerStore((state) => state.loadCustomers);
  const openCreateForm = useCustomerStore((state) => state.openCreateForm);
  const openEditForm = useCustomerStore((state) => state.openEditForm);
  const deleteCustomer = useCustomerStore((state) => state.deleteCustomer);
  const { isAdmin } = useAuth();
  const runAction = useAsyncAction();

  useMountEffect(() => {
    void loadCustomers();
  });

  const handleDelete = (customer: Customer): void => {
    void runAction(() => deleteCustomer(customer.id), `${customer.name} deleted.`);
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadCustomers()} />;
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone you have sold to, and the details that go on their invoices."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
            Add customer
          </Button>
        }
      />

      {incompleteCount > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${incompleteCount} customer${
            incompleteCount === 1 ? '' : 's'
          } with no information yet`}
          description="These were created from a sale, so only the name is known. Edit one to add a contact number, TIN and address for their next invoice."
          action={
            <Button size="small" onClick={() => setIncompleteOnly(true)}>
              Show them
            </Button>
          }
        />
      )}

      <Card variant="outlined">
        <Flex gap={16} wrap align="center" style={{ marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search by name, contact number or TIN"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 360 }}
          />
          <Flex gap={8} align="center">
            <Switch checked={incompleteOnly} onChange={setIncompleteOnly} />
            <Typography.Text type="secondary">Only missing information</Typography.Text>
          </Flex>
        </Flex>

        <CustomerTable
          customers={customers}
          loading={loading}
          canDelete={isAdmin}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      </Card>

      <CustomerFormModal />
    </>
  );
};
