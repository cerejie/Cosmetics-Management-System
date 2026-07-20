import { useEffect } from 'react';
import { Alert, Form, Input, InputNumber, Modal, Segmented, Typography } from 'antd';
import { useProductStore } from '@/store/inventory/productStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { stockAdjustmentSchema } from '@/schemas/inventory/stockAdjustment.schema';
import type { StockAdjustmentValues } from '@/schemas/inventory/stockAdjustment.schema';
import { zodRules } from '@/utils/common/formRules';
import { formatNumber } from '@/utils/common/format';

const rules = zodRules(stockAdjustmentSchema.shape);

const FORM_ID = 'stock-adjustment-form';

export const StockAdjustmentModal = (): JSX.Element => {
  const [form] = Form.useForm<StockAdjustmentValues>();
  const product = useProductStore((state) => state.adjustingProduct);
  const saving = useProductStore((state) => state.saving);
  const close = useProductStore((state) => state.closeStockAdjustment);
  const adjustStock = useProductStore((state) => state.adjustStock);
  const runAction = useAsyncAction();

  const direction = Form.useWatch('direction', form);
  const quantity = Form.useWatch('quantity', form);

  useEffect(() => {
    if (product) form.setFieldsValue({ direction: 'in', quantity: 1, reason: '' });
  }, [form, product]);

  const handleFinish = (values: StockAdjustmentValues): void => {
    if (!product) return;
    void runAction(() => adjustStock(product.id, values), 'Stock updated.');
  };

  const resultingStock =
    product && typeof quantity === 'number'
      ? product.stockQuantity + (direction === 'out' ? -quantity : quantity)
      : null;

  return (
    <Modal
      title={product ? `Adjust stock — ${product.name}` : 'Adjust stock'}
      open={product !== null}
      onCancel={close}
      okText="Apply adjustment"
      okButtonProps={{ htmlType: 'submit', form: FORM_ID, loading: saving }}
      destroyOnHidden
    >
      {product && (
        <>
          <Typography.Paragraph type="secondary">
            Currently on hand: <strong>{formatNumber(product.stockQuantity)}</strong>
          </Typography.Paragraph>

          <Form
            id={FORM_ID}
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{ direction: 'in', quantity: 1, reason: '' }}
          >
            <Form.Item name="direction" label="Direction">
              <Segmented
                block
                options={[
                  { label: 'Stock in', value: 'in' },
                  { label: 'Stock out', value: 'out' },
                ]}
              />
            </Form.Item>

            <Form.Item name="quantity" label="Quantity" rules={[...rules.quantity]}>
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="reason" label="Reason" rules={[...rules.reason]}>
              <Input.TextArea rows={2} placeholder="Delivery from supplier, damaged unit, recount…" />
            </Form.Item>
          </Form>

          {resultingStock !== null && resultingStock < 0 && (
            <Alert
              type="error"
              showIcon
              message="Not enough stock"
              description="This would take the product below zero."
            />
          )}

          {resultingStock !== null && resultingStock >= 0 && (
            <Typography.Text type="secondary">
              New quantity will be <strong>{formatNumber(resultingStock)}</strong>.
            </Typography.Text>
          )}
        </>
      )}
    </Modal>
  );
};
