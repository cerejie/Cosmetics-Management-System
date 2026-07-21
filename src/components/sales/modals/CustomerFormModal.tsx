import { Modal } from 'antd';
import { useCustomerStore } from '@/store/sales/customerStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { CustomerForm, CUSTOMER_FORM_ID } from '@/components/sales/forms/CustomerForm';
import type { CustomerFormValues } from '@/schemas/sales/customer.schema';

export const CustomerFormModal = (): JSX.Element => {
  const open = useCustomerStore((state) => state.formOpen);
  const saving = useCustomerStore((state) => state.saving);
  const editingCustomer = useCustomerStore((state) => state.editingCustomer);
  const closeForm = useCustomerStore((state) => state.closeForm);
  const saveCustomer = useCustomerStore((state) => state.saveCustomer);
  const runAction = useAsyncAction();

  const handleSubmit = (values: CustomerFormValues): void => {
    void runAction(
      () => saveCustomer(editingCustomer?.id ?? null, values),
      editingCustomer ? 'Customer saved.' : 'Customer added.',
    );
  };

  return (
    <Modal
      title={editingCustomer ? `Edit ${editingCustomer.name}` : 'Add a customer'}
      open={open}
      onCancel={closeForm}
      okText={editingCustomer ? 'Save changes' : 'Add customer'}
      cancelText="Cancel"
      okButtonProps={{ htmlType: 'submit', form: CUSTOMER_FORM_ID, loading: saving, size: 'large' }}
      cancelButtonProps={{ size: 'large' }}
      destroyOnHidden
      width={640}
    >
      <CustomerForm customer={editingCustomer} onSubmit={handleSubmit} />
    </Modal>
  );
};
