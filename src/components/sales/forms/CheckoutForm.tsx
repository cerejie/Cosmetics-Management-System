import { App, AutoComplete, Button, Form, Input, InputNumber, Modal, Select, Tooltip } from 'antd';
import {
  CreditCardOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ShortcutHint } from '@/components/common/feedback/ShortcutHint';
import { MobileNumberInput } from '@/components/common/inputs/MobileNumberInput';
import { TinInput } from '@/components/common/inputs/TinInput';
import { useCartStore } from '@/store/sales/cartStore';
import { useSalesStore } from '@/store/sales/salesStore';
import { useProductStore } from '@/store/inventory/productStore';
import { useCustomerStore } from '@/store/sales/customerStore';
import { useCart } from '@/hooks/sales/useCart';
import { useCustomerSuggestions } from '@/hooks/sales/useCustomerSuggestions';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { useHotkey } from '@/hooks/common/useHotkey';
import { saleFormSchema, type DiscountMode, type SaleFormInput } from '@/schemas/sales/sale.schema';
import { zodRules } from '@/utils/common/formRules';
import { resolveDiscountAmount } from '@/utils/sales/discount';
import { formatCurrency } from '@/utils/common/format';
import { PAYMENT_METHOD_OPTIONS } from '@/config/constants';
import * as styles from './CheckoutForm.css';

const rules = zodRules(saleFormSchema.shape);

const DISCOUNT_MODE_OPTIONS: readonly { readonly label: string; readonly value: DiscountMode }[] = [
  { label: '%', value: 'percent' },
  { label: '₱', value: 'amount' },
];

const INITIAL_VALUES: SaleFormInput = {
  customerName: '',
  customerContact: '',
  customerTin: '',
  paymentMethod: 'cash',
  discountMode: 'percent',
  discountValue: 0,
  note: '',
};

export const CheckoutForm = (): JSX.Element => {
  const [form] = Form.useForm<SaleFormInput>();
  const { lines, subtotal, isEmpty, itemCount } = useCart();
  const clearCart = useCartStore((state) => state.clear);
  const advancedOpen = useCartStore((state) => state.advancedOpen);
  const setAdvancedOpen = useCartStore((state) => state.setAdvancedOpen);
  const createSale = useSalesStore((state) => state.createSale);
  const submitting = useSalesStore((state) => state.submitting);
  const loadProducts = useProductStore((state) => state.loadProducts);
  const loadCustomers = useCustomerStore((state) => state.loadCustomers);
  const customerOptions = useCustomerSuggestions();
  const runAction = useAsyncAction();
  const { message } = App.useApp();

  const discountMode = Form.useWatch('discountMode', form) ?? INITIAL_VALUES.discountMode;
  const discountValue = Form.useWatch('discountValue', form) ?? 0;
  const note = Form.useWatch('note', form) ?? '';
  const discount = resolveDiscountAmount(discountMode, discountValue, subtotal);
  const total = subtotal - discount;

  const extrasLabel = ((): string => {
    if (discount > 0 && note.trim()) return `${formatCurrency(discount)} off · note added`;
    if (discount > 0) return `${formatCurrency(discount)} discount`;
    if (note.trim()) return 'Note added';
    return 'Add discount or note';
  })();

  /**
   * Choosing someone on file fills in the rest of their invoice details. A
   * name that is only typed leaves them blank — `create_sale` then creates the
   * customer, and whatever was typed here becomes their first details.
   */
  const handleCustomerSelect = (name: string): void => {
    const match = customerOptions.find((option) => option.value === name);
    if (!match) return;

    form.setFieldsValue({
      customerContact: match.customer.contactNumber,
      customerTin: match.customer.tin,
    });
  };

  /** Keeps the dialog open on an invalid discount so the error stays visible. */
  const handleApplyExtras = async (): Promise<void> => {
    try {
      await form.validateFields(['discountValue', 'note']);
      setAdvancedOpen(false);
    } catch {
      /* antd renders the field errors. */
    }
  };

  const handleFinish = async (values: SaleFormInput): Promise<void> => {
    const result = await runAction(() =>
      createSale(lines, {
        customerName: values.customerName,
        customerContact: values.customerContact,
        customerTin: values.customerTin,
        paymentMethod: values.paymentMethod,
        note: values.note,
        discountAmount: resolveDiscountAmount(values.discountMode, values.discountValue, subtotal),
      }),
    );
    if (!result.ok) return;

    // Stock changed server-side, so refresh the catalogue the picker reads
    // from — and the customer list, which the sale may have just added to.
    clearCart();
    form.resetFields();
    await Promise.all([loadProducts(), loadCustomers()]);
    message.success(`Purchase ${result.data} recorded.`);
  };

  useHotkey('F5', () => form.submit(), { enabled: !isEmpty && !submitting });
  useHotkey('F3', clearCart, { enabled: !isEmpty });

  return (
    <Form
      form={form}
      layout="vertical"
      className={styles.form}
      onFinish={handleFinish}
      initialValues={INITIAL_VALUES}
      disabled={isEmpty}
    >
      <div className={styles.fields}>
        <Form.Item
          name="customerName"
          label="Customer"
          rules={[...rules.customerName]}
          tooltip="Pick someone on file, or type a new name — they are added to your customers automatically."
        >
          <AutoComplete
            options={[...customerOptions]}
            onSelect={handleCustomerSelect}
            filterOption={(input, option) =>
              (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Walk-in customer"
            />
          </AutoComplete>
        </Form.Item>

        <Form.Item
          name="customerContact"
          label="Mobile number (optional)"
          rules={[...rules.customerContact]}
          tooltip="Printed on the invoice when the customer asks for one."
        >
          <MobileNumberInput />
        </Form.Item>

        <Form.Item
          name="customerTin"
          label="TIN (optional)"
          rules={[...rules.customerTin]}
          tooltip="Filled in automatically for a customer on file."
        >
          <TinInput />
        </Form.Item>

        <Form.Item name="paymentMethod" label="Payment method" rules={[...rules.paymentMethod]}>
          <Select
            options={[...PAYMENT_METHOD_OPTIONS]}
            prefix={<CreditCardOutlined style={{ color: '#94a3b8' }} />}
          />
        </Form.Item>

        <Button
          block
          type="dashed"
          icon={<TagOutlined />}
          onClick={() => setAdvancedOpen(true)}
          className={styles.extrasTrigger}
        >
          {extrasLabel}
        </Button>
      </div>

      <div className={styles.footer}>
        <div className={styles.summary}>
          <div className={styles.row}>
            <span>Subtotal ({itemCount === 1 ? '1 item' : `${itemCount} items`})</span>
            <span className={styles.rowValue}>{formatCurrency(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className={styles.row}>
              <span>Discount</span>
              <span className={styles.rowValue}>−{formatCurrency(discount)}</span>
            </div>
          )}

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total due</span>
            <span className={styles.totalValue}>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Tooltip title="Clear cart (F3)">
            <Button
              danger
              size="large"
              className={styles.clear}
              icon={<DeleteOutlined />}
              onClick={clearCart}
              aria-label="Clear cart"
            />
          </Tooltip>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className={styles.submit}
            icon={<ShoppingCartOutlined />}
            loading={submitting}
            disabled={isEmpty}
          >
            Complete order
            <ShortcutHint keyLabel="F5" tone="onPrimary" />
          </Button>
        </div>
      </div>

      {/*
        Portalled, but still inside the Form's React tree, so these fields stay
        bound to it. Keeping them out of the flow is the point: an inline panel
        grew the card and pushed the pay button out of reach.

        forceRender is required, not cosmetic: without it antd defers the dialog
        body until the first open, the fields never register, and submitting
        without touching them yields values with no note or discount at all.
      */}
      <Modal
        forceRender
        open={advancedOpen}
        title="Discount & note"
        okText="Apply"
        width={420}
        onOk={handleApplyExtras}
        onCancel={() => setAdvancedOpen(false)}
      >
        <Form.Item label="Discount" required={false}>
          <div className={styles.discountRow}>
            <Form.Item name="discountMode" noStyle>
              <Select<DiscountMode>
                options={[...DISCOUNT_MODE_OPTIONS]}
                style={{ width: 76 }}
                aria-label="Discount type"
              />
            </Form.Item>

            <Form.Item
              name="discountValue"
              noStyle
              dependencies={['discountMode']}
              rules={[
                ...rules.discountValue,
                {
                  validator: async (_, value: number) => {
                    if (typeof value !== 'number') return;
                    if (discountMode === 'percent' && value > 100) {
                      throw new Error('A percentage discount cannot exceed 100%');
                    }
                    if (discountMode === 'amount' && value > subtotal) {
                      throw new Error('Discount cannot exceed the subtotal');
                    }
                  },
                },
              ]}
            >
              <InputNumber
                min={0}
                max={discountMode === 'percent' ? 100 : subtotal}
                precision={2}
                style={{ flex: 1 }}
                aria-label="Discount value"
              />
            </Form.Item>

            <span className={styles.discountPreview}>{formatCurrency(discount)}</span>
          </div>
        </Form.Item>

        <Form.Item
          name="note"
          label="Note (optional)"
          rules={[...rules.note]}
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea rows={3} placeholder="Add a note..." />
        </Form.Item>
      </Modal>
    </Form>
  );
};
