import { useEffect } from 'react';
import { Alert, Form, Input, Modal, Select } from 'antd';
import { useUserStore } from '@/store/users/userStore';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { createUserSchema, type CreateUserValues } from '@/schemas/users/user.schema';
import { zodRules } from '@/utils/common/formRules';
import { ROLE_LABELS } from '@/types/auth/auth.types';

const rules = zodRules(createUserSchema.shape);
const FORM_ID = 'create-user-form';

export const CreateUserModal = (): JSX.Element => {
  const [form] = Form.useForm<CreateUserValues>();
  const open = useUserStore((state) => state.formOpen);
  const saving = useUserStore((state) => state.saving);
  const closeForm = useUserStore((state) => state.closeForm);
  const createUser = useUserStore((state) => state.createUser);
  const { creatableRoles } = useAuth();
  const runAction = useAsyncAction();

  const defaultRole = creatableRoles[0];

  useEffect(() => {
    if (open && defaultRole) {
      form.setFieldsValue({ fullName: '', username: '', password: '', role: defaultRole });
    }
  }, [form, open, defaultRole]);

  const handleFinish = (values: CreateUserValues): void => {
    void runAction(() => createUser(values), `${values.fullName} can now sign in.`);
  };

  return (
    <Modal
      title="Add a user"
      open={open}
      onCancel={closeForm}
      okText="Create account"
      okButtonProps={{ htmlType: 'submit', form: FORM_ID, loading: saving }}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Share these credentials securely"
        description="The account is active immediately. Ask them to change the password after their first sign-in."
      />

      <Form id={FORM_ID} form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="fullName" label="Full name" rules={[...rules.fullName]}>
          <Input placeholder="Maria Santos" autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="username"
          label="Username"
          rules={[...rules.username]}
          tooltip="What they will type to sign in. No email address is needed."
        >
          <Input
            placeholder="maria.santos"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Temporary password"
          rules={[...rules.password]}
          tooltip="At least 8 characters."
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item name="role" label="Role" rules={[...rules.role]}>
          <Select
            options={creatableRoles.map((role) => ({ label: ROLE_LABELS[role], value: role }))}
            disabled={creatableRoles.length <= 1}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
