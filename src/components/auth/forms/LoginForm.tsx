import { Alert, Button, Form, Input } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth/authStore';
import { loginSchema, type LoginValues } from '@/schemas/auth/login.schema';
import { zodRules } from '@/utils/common/formRules';
import { ROUTE_PATHS } from '@/config/routes';

const rules = zodRules(loginSchema.shape);

interface LocationState {
  readonly from?: string;
}

export const LoginForm = (): JSX.Element => {
  const [form] = Form.useForm<LoginValues>();
  const signIn = useAuthStore((state) => state.signIn);
  const signingIn = useAuthStore((state) => state.signingIn);
  const error = useAuthStore((state) => state.error);
  const navigate = useNavigate();
  const location = useLocation();

  const handleFinish = async (values: LoginValues): Promise<void> => {
    try {
      await signIn(values);
      const from = (location.state as LocationState | null)?.from;
      navigate(from ?? ROUTE_PATHS.dashboard, { replace: true });
    } catch {
      // The store surfaces the message through `error`.
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false} size="large">
      {error && (
        <Form.Item>
          <Alert type="error" message={error} showIcon />
        </Form.Item>
      )}

      <Form.Item name="email" label="Email" rules={[...rules.email]}>
        <Input prefix={<MailOutlined />} placeholder="you@example.com" autoComplete="email" />
      </Form.Item>

      <Form.Item name="password" label="Password" rules={[...rules.password]}>
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Your password"
          autoComplete="current-password"
        />
      </Form.Item>

      <Button type="primary" htmlType="submit" loading={signingIn} block>
        Sign in
      </Button>
    </Form>
  );
};
