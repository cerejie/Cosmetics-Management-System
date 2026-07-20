import { Card, Empty, List, Typography } from 'antd';
import { useSalesMetrics } from '@/hooks/sales/useSalesMetrics';
import { formatCurrency, formatNumber } from '@/utils/common/format';

export const TopProductsCard = (): JSX.Element => {
  const { topProducts, loading } = useSalesMetrics();

  return (
    <Card title="Best sellers" loading={loading} variant="outlined">
      <List
        dataSource={[...topProducts]}
        locale={{
          emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No sales yet" />,
        }}
        renderItem={(product, index) => (
          <List.Item key={product.productId}>
            <List.Item.Meta
              avatar={<Typography.Text type="secondary">{index + 1}</Typography.Text>}
              title={product.productName}
              description={`${formatNumber(product.quantity)} sold`}
            />
            <Typography.Text strong>{formatCurrency(product.revenue)}</Typography.Text>
          </List.Item>
        )}
      />
    </Card>
  );
};
