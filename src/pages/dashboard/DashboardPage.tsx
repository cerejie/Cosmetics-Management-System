import { Button, Col, Row } from 'antd';
import { PlusOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/config/routes';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { SalesSummaryCards } from '@/components/dashboard/cards/SalesSummaryCards';
import { RevenueTrendCard } from '@/components/dashboard/charts/RevenueTrendCard';
import { TopProductsCard } from '@/components/dashboard/cards/TopProductsCard';
import { LowStockCard } from '@/components/dashboard/cards/LowStockCard';
import { useProductStore } from '@/store/inventory/productStore';
import { useSalesStore } from '@/store/sales/salesStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useAuth } from '@/hooks/auth/useAuth';

export const DashboardPage = (): JSX.Element => {
  const loadProducts = useProductStore((state) => state.loadProducts);
  const loadSales = useSalesStore((state) => state.loadSales);
  const { user } = useAuth();
  const navigate = useNavigate();

  useMountEffect(() => {
    void loadProducts();
    void loadSales();
  });

  return (
    <>
      <PageHeader
        title={`Welcome back${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}`}
        description="Today's performance and anything that needs your attention."
        extra={
          <>
            <Button icon={<ShoppingOutlined />} onClick={() => navigate(ROUTE_PATHS.inventory.products)}>
              Inventory
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(ROUTE_PATHS.sales.newSale)}
            >
              New purchase
            </Button>
          </>
        }
      />

      <SalesSummaryCards />

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={16}>
          <RevenueTrendCard />
        </Col>
        <Col xs={24} xl={8}>
          <TopProductsCard />
        </Col>
        <Col xs={24}>
          <LowStockCard />
        </Col>
      </Row>
    </>
  );
};
