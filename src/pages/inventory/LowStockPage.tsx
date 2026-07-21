import { Card, Col, Flex, Input, InputNumber, Row, Switch, Tooltip, Typography } from 'antd';
import { SearchOutlined, StopOutlined, WalletOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { StatCard } from '@/components/common/cards/StatCard';
import { LowStockTable } from '@/components/inventory/tables/LowStockTable';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useLowStock } from '@/hooks/inventory/useLowStock';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { useAuth } from '@/hooks/auth/useAuth';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import { ROUTE_PATHS } from '@/config/routes';
import type { Product } from '@/types/inventory/inventory.types';

const DEFAULT_THRESHOLD = 10;

export const LowStockPage = (): JSX.Element => {
  const { products, loading, outOfStockCount, restockCost } = useLowStock();
  const error = useProductStore((state) => state.error);
  const search = useProductStore((state) => state.search);
  const setSearch = useProductStore((state) => state.setSearch);
  const threshold = useProductStore((state) => state.lowStockThreshold);
  const setThreshold = useProductStore((state) => state.setLowStockThreshold);
  const reorderSavingId = useProductStore((state) => state.reorderSavingId);
  const updateReorderLevel = useProductStore((state) => state.updateReorderLevel);
  const loadProducts = useProductStore((state) => state.loadProducts);
  const loadCategories = useCategoryStore((state) => state.loadCategories);
  const addLines = usePurchaseStore((state) => state.addLines);
  const { isAdmin } = useAuth();
  const runAction = useAsyncAction();
  const navigate = useNavigate();

  useMountEffect(() => {
    void loadProducts();
    void loadCategories();
  });

  const handleReorderLevelChange = (product: Product, reorderLevel: number): void => {
    void runAction(
      () => updateReorderLevel(product, reorderLevel),
      `${product.name} will now warn at ${formatNumber(reorderLevel)}.`,
    );
  };

  // Drops the shortfall onto the purchase draft and jumps to it, so the
  // warning leads straight to the only screen that can act on it.
  const handleOrder = (product: Product): void => {
    const shortfall = Math.max(product.reorderLevel - product.stockQuantity, 0);

    addLines([
      {
        productId: product.id,
        quantity: shortfall > 0 ? shortfall : 1,
        unitCost: product.costPrice,
      },
    ]);
    navigate(ROUTE_PATHS.purchasing.newPurchase);
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadProducts()} />;
  }

  return (
    <>
      <PageHeader
        title="Low stock"
        description="Products at or below the level you want to be warned at."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Needs attention"
            value={formatNumber(products.length)}
            suffix="products"
            tone="warning"
            icon={<WarningOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Out of stock"
            value={formatNumber(outOfStockCount)}
            suffix="products"
            tone="danger"
            icon={<StopOutlined />}
            loading={loading}
            hint="Cannot be sold right now"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Cost to restock"
            value={formatCurrency(restockCost)}
            icon={<WalletOutlined />}
            loading={loading}
            hint="To bring everything back to its level"
          />
        </Col>
      </Row>

      <Card variant="outlined">
        <Flex gap={16} wrap align="center" style={{ marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 300 }}
          />

          <Flex gap={8} align="center">
            <Tooltip title="Off: each product uses its own level. On: review the whole list against one number.">
              <Typography.Text type="secondary">Use one level for everything</Typography.Text>
            </Tooltip>
            <Switch
              checked={threshold !== null}
              onChange={(checked) => setThreshold(checked ? DEFAULT_THRESHOLD : null)}
            />
            {threshold !== null && (
              <InputNumber
                min={0}
                precision={0}
                value={threshold}
                onChange={(value) => setThreshold(value ?? 0)}
                addonBefore="At or below"
                style={{ width: 190 }}
                aria-label="Low stock level for the whole list"
              />
            )}
          </Flex>
        </Flex>

        <LowStockTable
          products={products}
          loading={loading}
          canManage={isAdmin}
          savingProductId={reorderSavingId}
          onReorderLevelChange={handleReorderLevelChange}
          onOrder={handleOrder}
        />
      </Card>
    </>
  );
};
