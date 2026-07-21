import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Typography,
} from 'antd';
import { CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { purchaseSchema } from '@/schemas/purchasing/purchase.schema';
import { zodRules } from '@/utils/common/formRules';
import { getPurchaseTotals, isCompleteLine } from '@/utils/purchasing/purchaseTotals';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import { PurchaseItemsTable } from '@/components/purchasing/tables/PurchaseItemsTable';

const rules = zodRules(purchaseSchema.shape);

/** The date picker hands back Dayjs; the schema and the RPC want an ISO date. */
interface PurchaseFormFields {
  readonly supplierId: string | undefined;
  readonly purchaseDate: Dayjs;
  readonly note: string;
}

const cardTitle = (title: string, subtitle: string): JSX.Element => (
  <Flex vertical gap={2}>
    <Typography.Text strong style={{ fontSize: 18 }}>
      {title}
    </Typography.Text>
    <Typography.Text type="secondary" style={{ fontSize: 14, fontWeight: 400 }}>
      {subtitle}
    </Typography.Text>
  </Flex>
);

export const PurchaseForm = (): JSX.Element => {
  const [form] = Form.useForm<PurchaseFormFields>();
  const lines = usePurchaseStore((state) => state.draftLines);
  const submitting = usePurchaseStore((state) => state.submitting);
  const addLine = usePurchaseStore((state) => state.addLine);
  const resetDraft = usePurchaseStore((state) => state.resetDraft);
  const createPurchase = usePurchaseStore((state) => state.createPurchase);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const runAction = useAsyncAction();

  // Watched rather than read on submit: the supplier's invoice details are
  // shown as soon as one is picked, so gaps are obvious before saving.
  const supplierId = Form.useWatch('supplierId', form);
  const supplier = suppliers.find((candidate) => candidate.id === supplierId) ?? null;

  const completeLines = lines.filter(isCompleteLine);
  const totals = getPurchaseTotals(completeLines);
  const canSubmit = completeLines.length > 0;

  const handleSubmit = async (): Promise<void> => {
    const fields = await form.validateFields();
    const parsed = purchaseSchema.safeParse({
      supplierId: fields.supplierId,
      purchaseDate: fields.purchaseDate?.format('YYYY-MM-DD') ?? '',
      note: fields.note ?? '',
    });

    if (!parsed.success) return;

    const result = await runAction(
      () => createPurchase(parsed.data),
      'Purchase saved. The items have been added to your inventory.',
    );

    if (result.ok) form.resetFields();
  };

  const handleClear = (): void => {
    form.resetFields();
    resetDraft();
  };

  return (
    <Form<PurchaseFormFields>
      form={form}
      layout="vertical"
      size="large"
      requiredMark
      initialValues={{ supplierId: undefined, purchaseDate: dayjs(), note: '' }}
    >
      <Card
        variant="outlined"
        style={{ marginBottom: 16 }}
        title={cardTitle('Supplier and delivery', 'Who you bought from, and when it arrived.')}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="supplierId" label="Supplier" rules={[...rules.supplierId]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Choose a supplier"
                options={suppliers.map((candidate) => ({
                  label: candidate.name,
                  value: candidate.id,
                }))}
                notFoundContent="Add a supplier on the Suppliers tab first"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="purchaseDate"
              label="Date received"
              rules={[{ required: true, message: 'Date is required' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" allowClear={false} />
            </Form.Item>
          </Col>
        </Row>

        {supplier && (
          <>
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              title="Details printed on the invoice"
            >
              <Descriptions.Item label="Contact person">
                {supplier.contactPerson || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Contact number">{supplier.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="TIN">{supplier.tin || '—'}</Descriptions.Item>
              <Descriptions.Item label="Payment terms">
                {supplier.paymentTerms || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {supplier.address || '—'}
              </Descriptions.Item>
            </Descriptions>

            {!supplier.tin && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 12 }}
                message="This supplier has no TIN on file"
                description="Add it on the Suppliers tab so it appears on the printed purchase invoice."
              />
            )}
          </>
        )}
      </Card>

      <Card
        variant="outlined"
        title={cardTitle('What did you buy?', 'Saving adds these items to your stock.')}
      >
        <PurchaseItemsTable />

        <Button
          type="dashed"
          size="large"
          icon={<PlusOutlined />}
          onClick={addLine}
          style={{ marginTop: 12, marginBottom: 20 }}
        >
          Add another product
        </Button>

        <Form.Item name="note" label="Notes (optional)">
          <Input.TextArea rows={2} placeholder="Anything worth remembering about this delivery" />
        </Form.Item>

        <Flex
          justify="space-between"
          align="center"
          gap={16}
          wrap
          style={{ padding: '16px 0 0', borderTop: '1px solid #e5e7eb' }}
        >
          <Flex vertical>
            <Typography.Text type="secondary">
              {formatNumber(totals.itemCount)} product(s) · {formatNumber(totals.totalQuantity)}{' '}
              item(s)
            </Typography.Text>
            <Typography.Text strong style={{ fontSize: 24, color: '#c2185b' }}>
              {formatCurrency(totals.total)}
            </Typography.Text>
          </Flex>

          <Flex gap={8} wrap>
            <Button size="large" onClick={handleClear} disabled={submitting}>
              Clear
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              loading={submitting}
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              Save purchase
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Form>
  );
};
