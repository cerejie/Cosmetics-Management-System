import { Modal } from 'antd';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { SupplierForm, SUPPLIER_FORM_ID } from '@/components/purchasing/forms/SupplierForm';
import type { SupplierFormValues } from '@/schemas/purchasing/supplier.schema';

export const SupplierFormModal = (): JSX.Element => {
  const open = useSupplierStore((state) => state.formOpen);
  const saving = useSupplierStore((state) => state.saving);
  const editingSupplier = useSupplierStore((state) => state.editingSupplier);
  const closeForm = useSupplierStore((state) => state.closeForm);
  const saveSupplier = useSupplierStore((state) => state.saveSupplier);
  const runAction = useAsyncAction();

  const handleSubmit = (values: SupplierFormValues): void => {
    void runAction(
      () => saveSupplier(editingSupplier?.id ?? null, values),
      editingSupplier ? 'Supplier saved.' : 'Supplier added.',
    );
  };

  return (
    <Modal
      title={editingSupplier ? 'Edit supplier' : 'Add a supplier'}
      open={open}
      onCancel={closeForm}
      okText={editingSupplier ? 'Save changes' : 'Add supplier'}
      cancelText="Cancel"
      okButtonProps={{ htmlType: 'submit', form: SUPPLIER_FORM_ID, loading: saving, size: 'large' }}
      cancelButtonProps={{ size: 'large' }}
      destroyOnHidden
      width={600}
    >
      <SupplierForm supplier={editingSupplier} onSubmit={handleSubmit} />
    </Modal>
  );
};
