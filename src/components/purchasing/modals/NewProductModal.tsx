import { Alert, Form, Input, InputNumber, Modal, Select } from 'antd';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { productSchema, type ProductFormValues } from '@/schemas/inventory/product.schema';
import { zodRules } from '@/utils/common/formRules';

const rules = zodRules(productSchema.shape);

const FORM_ID = 'new-product-from-purchase';

/**
 * Adds a product that is not on file yet, from inside the purchase screen —
 * the only place products are created. It starts at zero stock; the purchase
 * being typed in is what puts it on the shelf.
 */
export const NewProductModal = (): JSX.Element => {
  const [form] = Form.useForm<ProductFormValues>();
  const lineKey = usePurchaseStore((state) => state.newProductForLine);
  const closeNewProduct = usePurchaseStore((state) => state.closeNewProduct);
  const updateLine = usePurchaseStore((state) => state.updateLine);
  const saving = useProductStore((state) => state.saving);
  const createProduct = useProductStore((state) => state.createProduct);
  const categories = useCategoryStore((state) => state.categories);
  const runAction = useAsyncAction();

  const handleFinish = (): void => {
    // getFieldsValue(true) rather than onFinish's argument: antd only reports
    // fields that have a Form.Item, and brand, costPrice and isActive are
    // initial values with no control. Parsing the argument dropped costPrice,
    // the schema rejected it as missing, and the button silently did nothing.
    const parsed = productSchema.safeParse(form.getFieldsValue(true));
    if (!parsed.success || lineKey === null) return;

    void (async () => {
      const result = await runAction(
        () => createProduct(parsed.data),
        `${parsed.data.name} added to your products.`,
      );

      if (result.ok) {
        // Drop the new product straight onto the row that asked for it.
        updateLine(lineKey, { productId: result.data.id, unitCost: result.data.costPrice });
        form.resetFields();
        closeNewProduct();
      }
    })();
  };

  return (
    <Modal
      title="Add a new product"
      open={lineKey !== null}
      onCancel={closeNewProduct}
      okText="Add product"
      okButtonProps={{ htmlType: 'submit', form: FORM_ID, loading: saving }}
      destroyOnHidden
      width={560}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="This adds the product to your list"
        description="It starts with no stock. The quantity you type on the purchase is what puts it in your inventory."
      />

      <Form
        id={FORM_ID}
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleFinish}
        requiredMark
        initialValues={{
          sku: '',
          name: '',
          brand: '',
          categoryId: null,
          costPrice: 0,
          unitPrice: 0,
          reorderLevel: 0,
          isActive: true,
        }}
      >
        <Form.Item name="name" label="Product name" rules={[...rules.name]}>
          <Input placeholder="Hydrating Facial Cleanser 150ml" />
        </Form.Item>

        <Form.Item name="sku" label="Product code (SKU)" rules={[...rules.sku]}>
          <Input placeholder="SKN-001" />
        </Form.Item>

        <Form.Item name="categoryId" label="Category" rules={[...rules.categoryId]}>
          <Select
            allowClear
            placeholder="Choose a category"
            options={categories.map((category) => ({ label: category.name, value: category.id }))}
          />
        </Form.Item>

        <Form.Item
          name="unitPrice"
          label="Selling price"
          rules={[...rules.unitPrice]}
          tooltip="What you sell it for. You can change this later."
        >
          <InputNumber min={0} precision={2} prefix="₱" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="reorderLevel"
          label="Low stock warning at"
          rules={[...rules.reorderLevel]}
          tooltip="You will be warned when stock falls to this number."
          style={{ marginBottom: 0 }}
        >
          <InputNumber min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
