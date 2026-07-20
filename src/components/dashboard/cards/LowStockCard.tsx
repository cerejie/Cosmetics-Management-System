import { Card, Empty, List, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '@/store/inventory/productStore';
import { getStockLevel } from '@/types/inventory/inventory.types';
import { formatNumber } from '@/utils/common/format';
import { ROUTE_PATHS } from '@/config/routes';

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
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Everything is well stocked" />
          ),
        }}
        renderItem={(product) => (
          <List.Item key={product.id}>
            <List.Item.Meta
              title={product.name}
              description={
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {product.sku} · reorder at {formatNumber(product.reorderLevel)}
                </Typography.Text>
              }
            />
            <Tag color={product.stockQuantity === 0 ? 'error' : 'warning'}>
              {product.stockQuantity === 0
                ? 'Out of stock'
                : `${formatNumber(product.stockQuantity)} left`}
            </Tag>
          </List.Item>
        )}
      />
    </Card>
  );
};
