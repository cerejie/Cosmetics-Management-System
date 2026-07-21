import { useEffect } from 'react';
import { Col, Form, Input, Row } from 'antd';
import { supplierSchema, type SupplierFormValues } from '@/schemas/purchasing/supplier.schema';
import { zodRules } from '@/utils/common/formRules';
import type { Supplier } from '@/types/purchasing/purchasing.types';

const rules = zodRules(supplierSchema.shape);

export const SUPPLIER_FORM_ID = 'supplier-form';

interface SupplierFormProps {
  readonly supplier: Supplier | null;
  readonly onSubmit: (values: SupplierFormValues) => void;
}

const toInitialValues = (supplier: Supplier | null): SupplierFormValues => ({
  name: supplier?.name ?? '',
  contactPerson: supplier?.contactPerson ?? '',
  phone: supplier?.phone ?? '',
  email: supplier?.email ?? '',
  address: supplier?.address ?? '',
  note: supplier?.note ?? '',
});

export const SupplierForm = ({ supplier, onSubmit }: SupplierFormProps): JSX.Element => {
  const [form] = Form.useForm<SupplierFormValues>();

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(toInitialValues(supplier));
  }, [form, supplier]);

  const handleFinish = (values: SupplierFormValues): void => {
    const result = supplierSchema.safeParse(values);
    if (result.success) onSubmit(result.data);
  };

  return (
    <Form
      id={SUPPLIER_FORM_ID}
      form={form}
      layout="vertical"
      size="large"
      onFinish={handleFinish}
      initialValues={toInitialValues(supplier)}
      requiredMark
    >
      <Form.Item name="name" label="Supplier name" rules={[...rules.name]}>
        <Input placeholder="Beauty Supply PH" />
      </Form.Item>

      <Form.Item name="contactPerson" label="Contact person" rules={[...rules.contactPerson]}>
        <Input placeholder="Maria Santos" />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="phone" label="Phone" rules={[...rules.phone]}>
            <Input placeholder="+63 917 000 0000" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="email" label="Email" rules={[...rules.email]}>
            <Input placeholder="orders@supplier.com" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="address" label="Address" rules={[...rules.address]}>
        <Input placeholder="Unit 4, Ortigas Center, Pasig City" />
      </Form.Item>

      <Form.Item name="note" label="Notes (optional)" rules={[...rules.note]} style={{ marginBottom: 0 }}>
        <Input.TextArea rows={2} placeholder="Payment terms, delivery days…" />
      </Form.Item>
    </Form>
  );
};
