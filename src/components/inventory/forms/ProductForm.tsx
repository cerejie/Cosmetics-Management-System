import { useEffect } from 'react';
import { Col, Form, Input, InputNumber, Row, Select, Switch } from 'antd';
import { createProductSchema, productSchema } from '@/schemas/inventory/product.schema';
import type { CreateProductValues, ProductFormValues } from '@/schemas/inventory/product.schema';
import { zodRules } from '@/utils/common/formRules';
import type { Category, Product } from '@/types/inventory/inventory.types';

const rules = zodRules(createProductSchema.shape);

export const PRODUCT_FORM_ID = 'product-form';

interface ProductFormProps {
  readonly product: Product | null;
  readonly categories: readonly Category[];
  readonly onSubmit: (values: CreateProductValues | ProductFormValues) => void;
}

const toInitialValues = (product: Product | null): Partial<CreateProductValues> =>
  product
    ? {
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        categoryId: product.categoryId,
        costPrice: product.costPrice,
        unitPrice: product.unitPrice,
        reorderLevel: product.reorderLevel,
        isActive: product.isActive,
      }
    : {
        brand: '',
        categoryId: null,
        costPrice: 0,
        unitPrice: 0,
        stockQuantity: 0,
        reorderLevel: 0,
        isActive: true,
      };

export const ProductForm = ({ product, categories, onSubmit }: ProductFormProps): JSX.Element => {
  const [form] = Form.useForm<CreateProductValues>();
  const isEditing = product !== null;

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(toInitialValues(product));
  }, [form, product]);

  const handleFinish = (values: CreateProductValues): void => {
    const schema = isEditing ? productSchema : createProductSchema;
    const result = schema.safeParse(values);
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
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="sku" label="SKU" rules={[...rules.sku]}>
            <Input placeholder="SKN-001" disabled={isEditing} />
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

      <Row gutter={16}>
        {!isEditing && (
          <Col xs={24} sm={12}>
            <Form.Item
              name="stockQuantity"
              label="Opening stock"
              rules={[...rules.stockQuantity]}
              tooltip="After creation, stock changes only through adjustments and sales."
            >
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        )}
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

      <Form.Item name="isActive" label="Active" valuePropName="checked">
        <Switch />
      </Form.Item>
    </Form>
  );
};
