import { Card, Col, Flex, Input, Row, Segmented } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  SearchOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { StatCard } from '@/components/common/cards/StatCard';
import { StockMovementTable } from '@/components/inventory/tables/StockMovementTable';
import {
  useStockMovementStore,
  type DirectionFilter,
} from '@/store/inventory/stockMovementStore';
import { useFilteredStockMovements } from '@/hooks/inventory/useStockMovements';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { formatNumber } from '@/utils/common/format';

const DIRECTION_OPTIONS: readonly { readonly label: string; readonly value: DirectionFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Stocks in', value: 'in' },
  { label: 'Stocks out', value: 'out' },
];

export const StockMovementsPage = (): JSX.Element => {
  const { movements, loading, summary } = useFilteredStockMovements();
  const error = useStockMovementStore((state) => state.error);
  const search = useStockMovementStore((state) => state.search);
  const setSearch = useStockMovementStore((state) => state.setSearch);
  const directionFilter = useStockMovementStore((state) => state.directionFilter);
  const setDirectionFilter = useStockMovementStore((state) => state.setDirectionFilter);
  const loadMovements = useStockMovementStore((state) => state.loadMovements);

  useMountEffect(() => {
    void loadMovements();
  });

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadMovements()} />;
  }

  return (
    <>
      <PageHeader
        title="Stock movements"
        description="Every change to stock, from deliveries to sales, in one audit trail."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Stocks in"
            value={formatNumber(summary.stockIn)}
            suffix="items"
            tone="success"
            icon={<ArrowUpOutlined />}
            loading={loading}
            hint="Received from purchases"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Stocks out"
            value={formatNumber(summary.stockOut)}
            suffix="items"
            tone="danger"
            icon={<ArrowDownOutlined />}
            loading={loading}
            hint="Sold or returned to suppliers"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Net change"
            value={`${summary.net > 0 ? '+' : ''}${formatNumber(summary.net)}`}
            suffix="items"
            tone={summary.net >= 0 ? 'default' : 'warning'}
            icon={<SwapOutlined />}
            loading={loading}
            hint="Across the movements shown"
          />
        </Col>
      </Row>

      <Card variant="outlined">
        <Flex gap={12} wrap align="center" style={{ marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search by product or reason"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 320 }}
          />
          <Segmented<DirectionFilter>
            options={[...DIRECTION_OPTIONS]}
            value={directionFilter}
            onChange={setDirectionFilter}
          />
        </Flex>

        <StockMovementTable movements={movements} loading={loading} />
      </Card>
    </>
  );
};
