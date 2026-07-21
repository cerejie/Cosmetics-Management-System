import { useEffect } from 'react';
import { Alert, Col, Form, Input, InputNumber, Row, Select, Switch } from 'antd';
import { productSchema, type ProductFormValues } from '@/schemas/inventory/product.schema';
import { zodRules } from '@/utils/common/formRules';
import { formatNumber } from '@/utils/common/format';
import type { Category, Product } from '@/types/inventory/inventory.types';
import { FormSection } from '@/components/common/forms/FormSection';

const rules = zodRules(productSchema.shape);

export const PRODUCT_FORM_ID = 'product-form';

interface ProductFormProps {
  readonly product: Product | null;
  readonly categories: readonly Category[];
  readonly onSubmit: (values: ProductFormValues) => void;
}

const toInitialValues = (product: Product | null): ProductFormValues =>
  product
    ? {
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        categoryId: product.categoryId,
        costPrice: product.costPrice,
        unitPrice: product.unitPrice,
        stockQuantity: product.stockQuantity,
        reorderLevel: product.reorderLevel,
        isActive: product.isActive,
        stockReason: '',
      }
    : {
        sku: '',
        name: '',
        brand: '',
        categoryId: null,
        costPrice: 0,
        unitPrice: 0,
        stockQuantity: 0,
        reorderLevel: 0,
        isActive: true,
        stockReason: '',
      };

export const ProductForm = ({ product, categories, onSubmit }: ProductFormProps): JSX.Element => {
  const [form] = Form.useForm<ProductFormValues>();
  const isEditing = product !== null;

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(toInitialValues(product));
  }, [form, product]);

  const quantity = Form.useWatch('stockQuantity', form);
  const delta = product && typeof quantity === 'number' ? quantity - product.stockQuantity : 0;

  const handleFinish = (values: ProductFormValues): void => {
    const result = productSchema.safeParse(values);
    if (result.success) onSubmit(result.data);
  };

  return (
    <Form
      id={PRODUCT_FORM_ID}
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={toInitialValues(product)}
      requiredMark
    >
      <FormSection first title="Identification">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="sku" label="SKU" rules={[...rules.sku]}>
              <Input placeholder="SKN-001" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="brand" label="Brand" rules={[...rules.brand]}>
              <Input placeholder="Aurea" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="name" label="Product name" rules={[...rules.name]}>
          <Input placeholder="Hydrating Facial Cleanser 150ml" />
        </Form.Item>

        <Form.Item name="categoryId" label="Category" rules={[...rules.categoryId]}>
          <Select
            allowClear
            placeholder="Select a category"
            options={categories.map((category) => ({ label: category.name, value: category.id }))}
          />
        </Form.Item>
      </FormSection>

      <FormSection title="Pricing">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="costPrice" label="Cost price" rules={[...rules.costPrice]}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="₱" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="unitPrice" label="Selling price" rules={[...rules.unitPrice]}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="₱" />
            </Form.Item>
          </Col>
        </Row>
      </FormSection>

      <FormSection title="Stock">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="stockQuantity"
              label="Quantity on hand"
              rules={[...rules.stockQuantity]}
              tooltip="Changing this records an entry in the stock movement log."
            >
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="reorderLevel"
              label="Reorder level"
              rules={[...rules.reorderLevel]}
              tooltip="Products at or below this quantity are flagged as low stock."
            >
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        {isEditing && delta !== 0 && (
          <>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={`Stock will change by ${delta > 0 ? '+' : ''}${formatNumber(delta)}`}
              description="This is logged as an adjustment so the movement history stays accurate."
            />
            <Form.Item
              name="stockReason"
              label="Reason for the stock change"
              rules={[...rules.stockReason]}
            >
              <Input placeholder="Recount, delivery, damaged unit…" />
            </Form.Item>
          </>
        )}
      </FormSection>

      <FormSection title="Visibility">
        <Form.Item
          name="isActive"
          label="Active"
          valuePropName="checked"
          tooltip="Inactive products stay in reports but cannot be added to a purchase."
          style={{ marginBottom: 0 }}
        >
          <Switch />
        </Form.Item>
      </FormSection>
    </Form>
  );
};
