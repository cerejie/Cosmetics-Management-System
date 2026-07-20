import { useEffect } from 'react';
import { Form, Input, Modal } from 'antd';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { categorySchema, type CategoryFormValues } from '@/schemas/inventory/category.schema';
import { zodRules } from '@/utils/common/formRules';

const rules = zodRules(categorySchema.shape);
const FORM_ID = 'category-form';

export const CategoryFormModal = (): JSX.Element => {
  const [form] = Form.useForm<CategoryFormValues>();
  const open = useCategoryStore((state) => state.formOpen);
  const saving = useCategoryStore((state) => state.saving);
  const editingCategory = useCategoryStore((state) => state.editingCategory);
  const closeForm = useCategoryStore((state) => state.closeForm);
  const createCategory = useCategoryStore((state) => state.createCategory);
  const updateCategory = useCategoryStore((state) => state.updateCategory);
  const runAction = useAsyncAction();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: editingCategory?.name ?? '',
      description: editingCategory?.description ?? '',
    });
  }, [form, open, editingCategory]);

  const handleFinish = (values: CategoryFormValues): void => {
    if (editingCategory) {
      void runAction(() => updateCategory(editingCategory.id, values), 'Category updated.');
      return;
    }
    void runAction(() => createCategory(values), 'Category created.');
  };

  return (
    <Modal
      title={editingCategory ? 'Edit category' : 'New category'}
      open={open}
      onCancel={closeForm}
      okText={editingCategory ? 'Save changes' : 'Create category'}
      okButtonProps={{ htmlType: 'submit', form: FORM_ID, loading: saving }}
      destroyOnHidden
    >
      <Form
        id={FORM_ID}
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ name: '', description: '' }}
      >
        <Form.Item name="name" label="Name" rules={[...rules.name]}>
          <Input placeholder="Skincare" />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[...rules.description]}>
          <Input.TextArea rows={3} placeholder="Cleansers, serums, moisturisers…" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
