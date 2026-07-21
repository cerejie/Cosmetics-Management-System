import { useEffect } from 'react';
import { UserAddOutlined } from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/layout/AuthLayout';
import { RegisterForm } from '@/components/auth/forms/RegisterForm';
import { useAuthStore } from '@/store/auth/authStore';
import { useAuth } from '@/hooks/auth/useAuth';
import { ROUTE_PATHS } from '@/config/routes';

export const RegisterPage = (): JSX.Element => {
  const { isAuthenticated } = useAuth();
  const resetRegistration = useAuthStore((state) => state.resetRegistration);

  // Leaving and returning should show the form again, not the previous receipt.
  useEffect(() => resetRegistration, [resetRegistration]);

  if (isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.dashboard} replace />;
  }

  return (
    <AuthLayout
      icon={<UserAddOutlined />}
      title="Request Access"
      subtitle="An administrator approves new accounts"
    >
      <RegisterForm />
    </AuthLayout>
  );
};
