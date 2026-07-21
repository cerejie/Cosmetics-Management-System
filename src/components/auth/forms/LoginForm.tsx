import { Button, Divider, Flex, Form, Input, Typography } from 'antd';
import { ArrowRightOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FormError } from '@/components/common/feedback/FormError';
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
      <FormError message={error} />

      <Form.Item name="identifier" label="Username or email" rules={[...rules.identifier]}>
        <Input
          prefix={<UserOutlined />}
          placeholder="Your username, or email for the superadmin"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
        />
      </Form.Item>

      <Form.Item name="password" label="Password" rules={[...rules.password]}>
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </Form.Item>

      <Button
        type="primary"
        htmlType="submit"
        loading={signingIn}
        block
        icon={<ArrowRightOutlined />}
        iconPosition="end"
      >
        Sign In
      </Button>

      {/* Sessions are a hard 8 hours with no refresh, so say so rather than
          offering a "remember me" the backend cannot honour. */}
      <Typography.Paragraph
        type="secondary"
        style={{ marginTop: 12, marginBottom: 0, textAlign: 'center', fontSize: 12 }}
      >
        Sessions last 8 hours.
      </Typography.Paragraph>

      <Divider />

      <Flex vertical align="center" gap={4}>
        <Typography.Text strong>Need an account?</Typography.Text>
        <Typography.Text type="secondary">Contact your system administrator.</Typography.Text>
        <Link to={ROUTE_PATHS.register}>
          Request Access <ArrowRightOutlined />
        </Link>
      </Flex>
    </Form>
  );
};
