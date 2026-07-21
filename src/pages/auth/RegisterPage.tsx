import { useEffect } from 'react';
import { Card, Flex, Typography } from 'antd';
import { SkinOutlined } from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import { RegisterForm } from '@/components/auth/forms/RegisterForm';
import { useAuthStore } from '@/store/auth/authStore';
import { useAuth } from '@/hooks/auth/useAuth';
import { ROUTE_PATHS } from '@/config/routes';
import * as styles from './LoginPage.css';

export const RegisterPage = (): JSX.Element => {
  const { isAuthenticated } = useAuth();
  const resetRegistration = useAuthStore((state) => state.resetRegistration);

  // Leaving and returning should show the form again, not the previous receipt.
  useEffect(() => resetRegistration, [resetRegistration]);

  if (isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.dashboard} replace />;
  }

  return (
    <Flex className={styles.page}>
      <Card className={styles.card} variant="outlined">
        <Flex vertical align="center" gap={4} style={{ marginBottom: 24 }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            <SkinOutlined /> Cosmetics MS
          </Typography.Title>
          <Typography.Text type="secondary">Request an account</Typography.Text>
        </Flex>

        <RegisterForm />
      </Card>
    </Flex>
  );
};
