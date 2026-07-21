import { Alert, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { usePurchaseReturnStore } from '@/store/purchasing/purchaseReturnStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useProductStore } from '@/store/inventory/productStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { purchaseReturnSchema } from '@/schemas/purchasing/purchase.schema';
import { zodRules } from '@/utils/common/formRules';
import { formatNumber } from '@/utils/common/format';

const rules = zodRules(purchaseReturnSchema.shape);

const FORM_ID = 'purchase-return-form';

/** The date picker hands back Dayjs; the schema and the RPC want an ISO date. */
interface ReturnFormFields {
  readonly supplierId: string | undefined;
  readonly productId: string | undefined;
  readonly returnDate: Dayjs;
  readonly quantity: number;
  readonly reason: string;
}

export const PurchaseReturnFormModal = (): JSX.Element => {
  const [form] = Form.useForm<ReturnFormFields>();
  const open = usePurchaseReturnStore((state) => state.formOpen);
  const submitting = usePurchaseReturnStore((state) => state.submitting);
  const closeForm = usePurchaseReturnStore((state) => state.closeForm);
  const createReturn = usePurchaseReturnStore((state) => state.createReturn);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const products = useProductStore((state) => state.products);
  const runAction = useAsyncAction();

  const productId = Form.useWatch('productId', form);
  const selected = products.find((product) => product.id === productId) ?? null;

  const handleFinish = (fields: ReturnFormFields): void => {
    const parsed = purchaseReturnSchema.safeParse({
      supplierId: fields.supplierId,
      productId: fields.productId,
      returnDate: fields.returnDate?.format('YYYY-MM-DD') ?? '',
      quantity: fields.quantity,
      reason: fields.reason,
    });

    if (!parsed.success) return;

    void (async () => {
      const result = await runAction(
        () => createReturn(parsed.data),
        'Return saved. The stock has been taken out of your inventory.',
      );
      if (result.ok) form.resetFields();
    })();
  };

  return (
    <Modal
      title="Record a return to supplier"
      open={open}
      onCancel={closeForm}
      okText="Save return"
      cancelText="Cancel"
      okButtonProps={{ htmlType: 'submit', form: FORM_ID, loading: submitting, size: 'large' }}
      cancelButtonProps={{ size: 'large' }}
      destroyOnHidden
      width={600}
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="This removes stock"
        description="Use this when you send goods back to a supplier. The quantity is taken out of your inventory."
      />

      <Form<ReturnFormFields>
        id={FORM_ID}
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleFinish}
        requiredMark
        initialValues={{
          supplierId: undefined,
          productId: undefined,
          returnDate: dayjs(),
          quantity: 1,
          reason: '',
        }}
      >
        <Form.Item name="supplierId" label="Supplier" rules={[...rules.supplierId]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Choose a supplier"
            options={suppliers.map((supplier) => ({ label: supplier.name, value: supplier.id }))}
          />
        </Form.Item>

        <Form.Item name="productId" label="Product" rules={[...rules.productId]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Choose a product"
            options={products.map((product) => ({
              label: `${product.name} (${formatNumber(product.stockQuantity)} in stock)`,
              value: product.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity to return"
          rules={[...rules.quantity]}
          extra={
            selected ? `You currently have ${formatNumber(selected.stockQuantity)} in stock.` : undefined
          }
        >
          <InputNumber
            min={1}
            max={selected?.stockQuantity}
            precision={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="returnDate"
          label="Date"
          rules={[{ required: true, message: 'Date is required' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" allowClear={false} />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Reason"
          rules={[...rules.reason]}
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea rows={2} placeholder="Damaged, wrong item, expired…" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
