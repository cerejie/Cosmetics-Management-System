import { Card, Divider, Space, Tag } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { CartLineList } from '@/components/sales/lists/CartLineList';
import { CheckoutForm } from '@/components/sales/forms/CheckoutForm';
import { useCart } from '@/hooks/sales/useCart';

export const OrderSummaryCard = (): JSX.Element => {
  const { itemCount, isEmpty } = useCart();

  return (
    <Card
      variant="outlined"
      title={
        <Space size="small">
          <ShoppingCartOutlined />
          Order summary
        </Space>
      }
      extra={<Tag color="magenta">{itemCount === 1 ? '1 item' : `${itemCount} items`}</Tag>}
    >
      <CartLineList />

      {!isEmpty && <Divider style={{ marginBlock: 16 }} />}

      <CheckoutForm />
    </Card>
  );
};
