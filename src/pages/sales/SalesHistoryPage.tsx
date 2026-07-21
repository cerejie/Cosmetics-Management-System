import { useMemo } from 'react';
import { Button, Card, Flex, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { SalesTable } from '@/components/sales/tables/SalesTable';
import { SaleDetailModal } from '@/components/sales/modals/SaleDetailModal';
import { useSalesStore } from '@/store/sales/salesStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { filterSales } from '@/utils/sales/salesMetrics';
import { ROUTE_PATHS } from '@/config/routes';

export const SalesHistoryPage = (): JSX.Element => {
  const sales = useSalesStore((state) => state.sales);
  const status = useSalesStore((state) => state.status);
  const error = useSalesStore((state) => state.error);
  const search = useSalesStore((state) => state.search);
  const setSearch = useSalesStore((state) => state.setSearch);
  const loadSales = useSalesStore((state) => state.loadSales);
  const openDetail = useSalesStore((state) => state.openDetail);
  const navigate = useNavigate();

  useMountEffect(() => {
    void loadSales();
  });

  const filtered = useMemo(() => filterSales(sales, search), [sales, search]);

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadSales()} />;
  }

  return (
    <>
      <PageHeader
        title="Purchase history"
        description="Every transaction recorded by your team."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(ROUTE_PATHS.sales.newSale)}
          >
            New purchase
          </Button>
        }
      />

      <Card variant="outlined">
        <Flex style={{ marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search by reference or customer"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 320 }}
          />
        </Flex>

        <SalesTable sales={filtered} loading={status === 'loading'} onViewDetail={openDetail} />
      </Card>

      <SaleDetailModal />
    </>
  );
};
