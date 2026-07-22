import { useEffect } from 'react';
import { Alert, Col, DatePicker, Flex, Form, Input, Row, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  purchaseDetailsFields,
  purchaseDetailsSchema,
  type PurchaseDetailsFormValues,
} from '@/schemas/purchasing/purchase.schema';
import { zodRules } from '@/utils/common/formRules';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TERMS_OPTIONS,
  type Purchase,
} from '@/types/purchasing/purchasing.types';

const rules = zodRules(purchaseDetailsFields.shape);

export const PURCHASE_DETAILS_FORM_ID = 'purchase-details-form';

const PAYMENT_METHOD_OPTIONS = [
  { label: 'Not recorded', value: '' },
  ...PAYMENT_METHODS.map((method) => ({
    label: PAYMENT_METHOD_LABELS[method],
    value: method,
  })),
];

/** The date picker deals in Dayjs; the schema and the RPC want an ISO date. */
interface PurchaseDetailsFields {
  readonly purchaseDate: Dayjs;
  readonly invoiceNumber: string;
  readonly referenceNo: string;
  readonly paymentMethod: string;
  readonly paymentTerms: string;
  readonly note: string;
}

const toFields = (purchase: Purchase): PurchaseDetailsFields => ({
  purchaseDate: dayjs(purchase.purchaseDate),
  invoiceNumber: purchase.invoiceNumber,
  referenceNo: purchase.referenceNo,
  paymentMethod: purchase.paymentMethod,
  paymentTerms: purchase.paymentTerms,
  note: purchase.note,
});

interface PurchaseDetailsFormProps {
  readonly purchase: Purchase;
  readonly onSubmit: (values: PurchaseDetailsFormValues) => void;
}

/**
 * The supplier's paperwork on a purchase already recorded. The supplier, the
 * lines and the money are deliberately absent: they decide stock levels and the
 * average cost price, and cannot be honestly rewritten after the fact.
 */
export const PurchaseDetailsForm = ({
  purchase,
  onSubmit,
}: PurchaseDetailsFormProps): JSX.Element => {
  const [form] = Form.useForm<PurchaseDetailsFields>();

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(toFields(purchase));
  }, [form, purchase]);

  // A supplier's own wording is often not one of the standard terms, so what is
  // already on the purchase is offered alongside them rather than being lost.
  const ownTerms = purchase.paymentTerms.trim();
  const standard: readonly string[] = PAYMENT_TERMS_OPTIONS;
  const termsOptions = (
    ownTerms && !standard.includes(ownTerms) ? [ownTerms, ...standard] : standard
  ).map((term) => ({ label: term, value: term }));

  const handleFinish = (fields: PurchaseDetailsFields): void => {
    const result = purchaseDetailsSchema.safeParse({
      purchaseDate: fields.purchaseDate?.format('YYYY-MM-DD') ?? '',
      invoiceNumber: fields.invoiceNumber ?? '',
      referenceNo: fields.referenceNo ?? '',
      paymentMethod: fields.paymentMethod ?? '',
      paymentTerms: fields.paymentTerms ?? '',
      note: fields.note ?? '',
    });

    if (result.success) onSubmit(result.data);
  };

  return (
    <Flex vertical gap={16}>
      <Alert
        type="info"
        showIcon
        message="Paperwork only"
        description="The supplier, the products, quantities, costs and discounts cannot be changed here — they set your stock levels and average cost. Correct a wrong delivery with a purchase return."
      />

      <Form
        id={PURCHASE_DETAILS_FORM_ID}
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleFinish}
        initialValues={toFields(purchase)}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="purchaseDate"
              label="Purchase date"
              rules={[{ required: true, message: 'Date is required' }]}
            >
              <DatePicker style={{ width: '100%' }} format="MMM D, YYYY" allowClear={false} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="invoiceNumber"
              label="Supplier invoice no."
              rules={[...rules.invoiceNumber]}
              tooltip="The number on the supplier's own invoice. Unique per supplier."
            >
              <Input placeholder="INV-00123" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="referenceNo" label="Reference / DR no." rules={[...rules.referenceNo]}>
              <Input placeholder="DR-4471" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="paymentMethod" label="Paid by" rules={[...rules.paymentMethod]}>
              <Select options={PAYMENT_METHOD_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="paymentTerms" label="Payment terms" rules={[...rules.paymentTerms]}>
          <Select allowClear placeholder="Choose terms" options={termsOptions} />
        </Form.Item>

        <Form.Item name="note" label="Notes" rules={[...rules.note]} style={{ marginBottom: 0 }}>
          <Input.TextArea rows={2} placeholder="Anything worth remembering about this delivery" />
        </Form.Item>
      </Form>
    </Flex>
  );
};
