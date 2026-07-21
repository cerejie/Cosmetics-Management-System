import { useEffect } from 'react';
import { Col, Form, Input, Row } from 'antd';
import { MobileNumberInput } from '@/components/common/inputs/MobileNumberInput';
import { TinInput } from '@/components/common/inputs/TinInput';
import { customerSchema, type CustomerFormValues } from '@/schemas/sales/customer.schema';
import { zodRules } from '@/utils/common/formRules';
import type { Customer } from '@/types/sales/customers.types';

const rules = zodRules(customerSchema.shape);

export const CUSTOMER_FORM_ID = 'customer-form';

interface CustomerFormProps {
  readonly customer: Customer | null;
  readonly onSubmit: (values: CustomerFormValues) => void;
}

const toInitialValues = (customer: Customer | null): CustomerFormValues => ({
  name: customer?.name ?? '',
  contactPerson: customer?.contactPerson ?? '',
  contactNumber: customer?.contactNumber ?? '',
  tin: customer?.tin ?? '',
  address: customer?.address ?? '',
  email: customer?.email ?? '',
  note: customer?.note ?? '',
});

export const CustomerForm = ({ customer, onSubmit }: CustomerFormProps): JSX.Element => {
  const [form] = Form.useForm<CustomerFormValues>();

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(toInitialValues(customer));
  }, [form, customer]);

  const handleFinish = (values: CustomerFormValues): void => {
    const result = customerSchema.safeParse(values);
    if (result.success) onSubmit(result.data);
  };

  return (
    <Form
      id={CUSTOMER_FORM_ID}
      form={form}
      layout="vertical"
      size="large"
      onFinish={handleFinish}
      initialValues={toInitialValues(customer)}
      requiredMark
    >
      <Form.Item name="name" label="Customer name" rules={[...rules.name]}>
        <Input placeholder="Maria Santos" />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="contactNumber" label="Mobile number" rules={[...rules.contactNumber]}>
            <MobileNumberInput />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="tin"
            label="TIN"
            rules={[...rules.tin]}
            tooltip="Filled onto the invoice when this customer is chosen at checkout."
          >
            <TinInput />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="contactPerson" label="Contact person" rules={[...rules.contactPerson]}>
            <Input placeholder="Who to ask for" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="email" label="Email" rules={[...rules.email]}>
            <Input placeholder="maria@example.com" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="address" label="Address" rules={[...rules.address]}>
        <Input.TextArea rows={2} placeholder="123 Ortigas Avenue, Pasig City" />
      </Form.Item>

      <Form.Item
        name="note"
        label="Notes (optional)"
        rules={[...rules.note]}
        style={{ marginBottom: 0 }}
      >
        <Input.TextArea rows={2} placeholder="Preferences, terms, anything worth remembering" />
      </Form.Item>
    </Form>
  );
};
