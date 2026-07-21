import { Modal } from 'antd';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { ProductForm, PRODUCT_FORM_ID } from '@/components/inventory/forms/ProductForm';
import type { ProductFormValues } from '@/schemas/inventory/product.schema';

export const ProductFormModal = (): JSX.Element => {
  const open = useProductStore((state) => state.formOpen);
  const saving = useProductStore((state) => state.saving);
  const editingProduct = useProductStore((state) => state.editingProduct);
  const closeForm = useProductStore((state) => state.closeForm);
  const saveProduct = useProductStore((state) => state.saveProduct);
  const categories = useCategoryStore((state) => state.categories);
  const runAction = useAsyncAction();

  const handleSubmit = (values: ProductFormValues): void => {
    void runAction(
      () => saveProduct(editingProduct?.id ?? null, values),
      editingProduct ? 'Product updated.' : 'Product created.',
    );
  };

  return (
    <Modal
      title={editingProduct ? 'Edit product' : 'New product'}
      open={open}
      onCancel={closeForm}
      okText={editingProduct ? 'Save changes' : 'Create product'}
      okButtonProps={{ htmlType: 'submit', form: PRODUCT_FORM_ID, loading: saving }}
      destroyOnHidden
      width={640}
    >
      <ProductForm product={editingProduct} categories={categories} onSubmit={handleSubmit} />
    </Modal>
  );
};
