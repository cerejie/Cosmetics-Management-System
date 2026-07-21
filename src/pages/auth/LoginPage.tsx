import { LockOutlined } from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/layout/AuthLayout';
import { LoginForm } from '@/components/auth/forms/LoginForm';
import { useAuth } from '@/hooks/auth/useAuth';
import { ROUTE_PATHS } from '@/config/routes';

export const LoginPage = (): JSX.Element => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.dashboard} replace />;
  }

  return (
    <AuthLayout
      icon={<LockOutlined />}
      title="Welcome Back!"
      subtitle="Sign in to continue to your account"
    >
      <LoginForm />
    </AuthLayout>
  );
};
