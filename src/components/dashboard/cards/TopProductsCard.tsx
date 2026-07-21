import { Card, List, Typography } from 'antd';
import { useSalesMetrics } from '@/hooks/sales/useSalesMetrics';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import { EmptyState } from '@/components/common/feedback/EmptyState';

const RANK_STYLE = {
  display: 'grid',
  placeItems: 'center',
  width: 24,
  height: 24,
  borderRadius: 6,
  background: '#f1f5f9',
  color: '#475569',
  fontSize: 12,
  fontWeight: 600,
} as const;

export const TopProductsCard = (): JSX.Element => {
  const { topProducts, loading } = useSalesMetrics();

  return (
    <Card title="Best sellers" loading={loading} variant="outlined" style={{ height: '100%' }}>
      <List
        dataSource={[...topProducts]}
        locale={{
          emptyText: (
            <EmptyState
              compact
              title="No purchases yet"
              description="Your best-selling products will rank here."
            />
          ),
        }}
        renderItem={(product, index) => (
          <List.Item key={product.productId}>
            <List.Item.Meta
              avatar={<span style={RANK_STYLE}>{index + 1}</span>}
              title={<Typography.Text ellipsis>{product.productName}</Typography.Text>}
              description={
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatNumber(product.quantity)} sold
                </Typography.Text>
              }
            />
            <Typography.Text strong>{formatCurrency(product.revenue)}</Typography.Text>
          </List.Item>
        )}
      />
    </Card>
  );
};
