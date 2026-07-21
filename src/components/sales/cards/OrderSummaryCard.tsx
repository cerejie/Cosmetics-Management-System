import { Card, Divider, Space, Tag } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { CartLineList } from '@/components/sales/lists/CartLineList';
import { CheckoutForm } from '@/components/sales/forms/CheckoutForm';
import { useCart } from '@/hooks/sales/useCart';
import * as styles from './OrderSummaryCard.css';

export const OrderSummaryCard = (): JSX.Element => {
  const { itemCount, isEmpty } = useCart();

  return (
    <Card
      variant="outlined"
      className={styles.card}
      classNames={{ body: styles.cardBody }}
      styles={{ header: { padding: '0 16px', minHeight: 48 }, body: { padding: '16px 16px 0' } }}
      title={
        <Space size="small">
          <ShoppingCartOutlined />
          Order summary
        </Space>
      }
      extra={<Tag color="magenta">{itemCount === 1 ? '1 item' : `${itemCount} items`}</Tag>}
    >
      <CartLineList />

      {!isEmpty && <Divider className={styles.divider} />}

      <CheckoutForm />
    </Card>
  );
};
