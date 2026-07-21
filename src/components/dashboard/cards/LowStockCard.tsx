import { Card, Flex, List, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '@/store/inventory/productStore';
import { getStockLevel } from '@/types/inventory/inventory.types';
import { formatNumber } from '@/utils/common/format';
import { ROUTE_PATHS } from '@/config/routes';
import { EmptyState } from '@/components/common/feedback/EmptyState';

const TILE_STYLE = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
} as const;

export const LowStockCard = (): JSX.Element => {
  const products = useProductStore((state) => state.products);
  const status = useProductStore((state) => state.status);
  const navigate = useNavigate();

  const needsAttention = products
    .filter((product) => product.isActive && getStockLevel(product) !== 'in_stock')
    .slice(0, 6);

  return (
    <Card
      title="Needs restocking"
      loading={status === 'loading'}
      variant="outlined"
      extra={
        <Typography.Link onClick={() => navigate(ROUTE_PATHS.inventory.products)}>
          View inventory
        </Typography.Link>
      }
    >
      <List
        dataSource={[...needsAttention]}
        grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }}
        locale={{
          emptyText: (
            <EmptyState
              compact
              title="Everything is well stocked"
              description="No active product is at or below its reorder level."
            />
          ),
        }}
        renderItem={(product) => (
          <List.Item key={product.id} style={{ paddingBlock: 0 }}>
            <Flex align="center" justify="space-between" gap={12} style={TILE_STYLE}>
              <Flex vertical gap={2} style={{ minWidth: 0 }}>
                <Typography.Text strong ellipsis>
                  {product.name}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {product.sku} · reorder at {formatNumber(product.reorderLevel)}
                </Typography.Text>
              </Flex>
              <Tag
                color={product.stockQuantity === 0 ? 'error' : 'warning'}
                style={{ marginInlineEnd: 0, flexShrink: 0 }}
              >
                {product.stockQuantity === 0
                  ? 'Out of stock'
                  : `${formatNumber(product.stockQuantity)} left`}
              </Tag>
            </Flex>
          </List.Item>
        )}
      />
    </Card>
  );
};
