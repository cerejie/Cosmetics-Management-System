import {
  App,
  Button,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Statistic,
  Typography,
} from 'antd';
import { useCartStore } from '@/store/sales/cartStore';
import { useSalesStore } from '@/store/sales/salesStore';
import { useProductStore } from '@/store/inventory/productStore';
import { useCart } from '@/hooks/sales/useCart';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { saleSchema, type SaleFormValues } from '@/schemas/sales/sale.schema';
import { zodRules } from '@/utils/common/formRules';
import { formatCurrency } from '@/utils/common/format';
import { PAYMENT_METHOD_OPTIONS } from '@/config/constants';

const rules = zodRules(saleSchema.shape);

const INITIAL_VALUES: SaleFormValues = {
  customerName: '',
  paymentMethod: 'cash',
  discountAmount: 0,
  note: '',
};

export const CheckoutForm = (): JSX.Element => {
  const [form] = Form.useForm<SaleFormValues>();
  const { lines, subtotal, isEmpty, itemCount } = useCart();
  const clearCart = useCartStore((state) => state.clear);
  const createSale = useSalesStore((state) => state.createSale);
  const submitting = useSalesStore((state) => state.submitting);
  const loadProducts = useProductStore((state) => state.loadProducts);
  const runAction = useAsyncAction();
  const { message } = App.useApp();

  const discount = Form.useWatch('discountAmount', form) ?? 0;
  const total = Math.max(0, subtotal - discount);

  const handleFinish = async (values: SaleFormValues): Promise<void> => {
    const result = await runAction(() => createSale(lines, values));
    if (!result.ok) return;

    // Stock changed server-side, so refresh the catalogue the picker reads from.
    clearCart();
    form.resetFields();
    await loadProducts();
    message.success(`Sale ${result.data} recorded.`);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={INITIAL_VALUES}
      disabled={isEmpty}
    >
      <Form.Item name="customerName" label="Customer" rules={[...rules.customerName]}>
        <Input placeholder="Walk-in customer" />
      </Form.Item>

      <Form.Item name="paymentMethod" label="Payment method" rules={[...rules.paymentMethod]}>
        <Select options={[...PAYMENT_METHOD_OPTIONS]} />
      </Form.Item>

      <Form.Item
        name="discountAmount"
        label="Discount"
        rules={[
          ...rules.discountAmount,
          {
            validator: async (_, value: number) => {
              if (typeof value === 'number' && value > subtotal) {
                throw new Error('Discount cannot exceed the subtotal');
              }
            },
          },
        ]}
      >
        <InputNumber min={0} max={subtotal} precision={2} prefix="₱" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="note" label="Note" rules={[...rules.note]}>
        <Input.TextArea rows={2} placeholder="Optional" />
      </Form.Item>

      <Divider />

      <Flex justify="space-between">
        <Typography.Text type="secondary">Subtotal ({itemCount} items)</Typography.Text>
        <Typography.Text>{formatCurrency(subtotal)}</Typography.Text>
      </Flex>

      <Flex justify="space-between" style={{ marginTop: 4 }}>
        <Typography.Text type="secondary">Discount</Typography.Text>
        <Typography.Text>−{formatCurrency(discount)}</Typography.Text>
      </Flex>

      <Divider style={{ margin: '12px 0' }} />

      <Statistic title="Total due" value={formatCurrency(total)} valueStyle={{ fontSize: 28 }} />

      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        loading={submitting}
        disabled={isEmpty}
        style={{ marginTop: 16 }}
      >
        Complete sale
      </Button>

      <Button type="text" block onClick={clearCart} disabled={isEmpty} style={{ marginTop: 8 }}>
        Clear cart
      </Button>
    </Form>
  );
};
