import { Form, Input, Modal, Typography } from 'antd';
import { useUserStore } from '@/store/users/userStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { resetPasswordFields, type ResetPasswordValues } from '@/schemas/users/user.schema';
import { zodRules } from '@/utils/common/formRules';

const rules = zodRules(resetPasswordFields.shape);
const FORM_ID = 'reset-password-form';

export const ResetPasswordModal = (): JSX.Element => {
  const [form] = Form.useForm<ResetPasswordValues>();
  const target = useUserStore((state) => state.passwordTarget);
  const saving = useUserStore((state) => state.saving);
  const closePasswordForm = useUserStore((state) => state.closePasswordForm);
  const setUserPassword = useUserStore((state) => state.setUserPassword);
  const runAction = useAsyncAction();

  const handleFinish = ({ password }: ResetPasswordValues): void => {
    if (!target) return;
    void runAction(
      () => setUserPassword(target.id, password),
      `${target.fullName}'s password has been changed.`,
    );
  };

  return (
    <Modal
      title="Reset password"
      open={target !== null}
      onCancel={closePasswordForm}
      okText="Change password"
      okButtonProps={{ htmlType: 'submit', form: FORM_ID, loading: saving }}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        Set a new password for <Typography.Text strong>@{target?.username}</Typography.Text> and pass
        it on securely. There is no password reset by email.
      </Typography.Paragraph>

      <Form id={FORM_ID} form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="password" label="New password" rules={[...rules.password]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Confirm the password' },
            // zodRules validates one field at a time, so the match check lives
            // here; resetPasswordSchema carries the same rule.
            ({ getFieldValue }) => ({
              validator: (_, value: string) =>
                !value || getFieldValue('password') === value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Passwords do not match')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
