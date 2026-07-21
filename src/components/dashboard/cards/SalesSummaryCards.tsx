import { Col, Row } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { StatCard } from '@/components/common/cards/StatCard';
import { useSalesMetrics } from '@/hooks/sales/useSalesMetrics';
import { useFilteredProducts } from '@/hooks/inventory/useProducts';
import { formatCurrency, formatNumber } from '@/utils/common/format';

export const SalesSummaryCards = (): JSX.Element => {
  const { summary, loading: salesLoading } = useSalesMetrics();
  const { summary: inventory, loading: inventoryLoading } = useFilteredProducts();

  const restockCount = inventory.lowStockCount + inventory.outOfStockCount;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} xl={6}>
        <StatCard
          title="Revenue today"
          value={formatCurrency(summary.todayRevenue)}
          icon={<DollarOutlined />}
          tone="success"
          loading={salesLoading}
          hint={`${formatNumber(summary.todayCount)} completed ${summary.todayCount === 1 ? 'purchase' : 'purchases'}`}
        />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <StatCard
          title="Purchases today"
          value={formatNumber(summary.todayCount)}
          icon={<ShoppingCartOutlined />}
          loading={salesLoading}
          hint="Completed transactions since midnight"
        />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <StatCard
          title="Revenue this month"
          value={formatCurrency(summary.monthRevenue)}
          icon={<DollarOutlined />}
          loading={salesLoading}
          hint={`${formatNumber(summary.monthCount)} purchases month to date`}
        />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <StatCard
          title="Needs restocking"
          value={formatNumber(restockCount)}
          icon={inventory.outOfStockCount > 0 ? <WarningOutlined /> : <InboxOutlined />}
          tone={inventory.outOfStockCount > 0 ? 'danger' : 'warning'}
          loading={inventoryLoading}
          suffix={`of ${formatNumber(inventory.totalProducts)}`}
          hint={
            inventory.outOfStockCount > 0
              ? `${formatNumber(inventory.outOfStockCount)} out of stock`
              : 'All products above their reorder level'
          }
        />
      </Col>
    </Row>
  );
};
