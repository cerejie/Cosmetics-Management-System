import { Alert, Button, Flex, Form, Input, Result, Typography } from 'antd';
import { IdcardOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth/authStore';
import { registerFields, type RegisterValues } from '@/schemas/auth/register.schema';
import { zodRules } from '@/utils/common/formRules';
import { ROUTE_PATHS } from '@/config/routes';

const rules = zodRules(registerFields.shape);

export const RegisterForm = (): JSX.Element => {
  const [form] = Form.useForm<RegisterValues>();
  const register = useAuthStore((state) => state.register);
  const signingIn = useAuthStore((state) => state.signingIn);
  const registered = useAuthStore((state) => state.registered);
  const error = useAuthStore((state) => state.error);

  const handleFinish = async (values: RegisterValues): Promise<void> => {
    try {
      await register(values);
    } catch {
      // The store surfaces the message through `error`.
    }
  };

  if (registered) {
    return (
      <Result
        status="success"
        title="Request sent"
        subTitle="An administrator has to approve your account before you can sign in."
        extra={<Link to={ROUTE_PATHS.login}>Back to sign in</Link>}
      />
    );
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false} size="large">
      {error && (
        <Form.Item>
          <Alert type="error" message={error} showIcon />
        </Form.Item>
      )}

      <Form.Item name="fullName" label="Full name" rules={[...rules.fullName]}>
        <Input prefix={<IdcardOutlined />} placeholder="Jane Dela Cruz" autoComplete="name" />
      </Form.Item>

      <Form.Item name="username" label="Username" rules={[...rules.username]}>
        <Input
          prefix={<UserOutlined />}
          placeholder="janedc"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
        />
      </Form.Item>

      <Form.Item name="password" label="Password" rules={[...rules.password]}>
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="Confirm password"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Confirm your password' },
          // zodRules works one field at a time, so the cross-field check is
          // expressed here; registerSchema carries the same rule for the server.
          ({ getFieldValue }) => ({
            validator: (_, value: string) =>
              !value || getFieldValue('password') === value
                ? Promise.resolve()
                : Promise.reject(new Error('Passwords do not match')),
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />
      </Form.Item>

      <Button type="primary" htmlType="submit" loading={signingIn} block>
        Request access
      </Button>

      <Flex justify="center" gap={4} style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">Already have an account?</Typography.Text>
        <Link to={ROUTE_PATHS.login}>Sign in</Link>
      </Flex>
    </Form>
  );
};
