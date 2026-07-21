import { Card, Flex, Typography } from 'antd';
import { SkinOutlined } from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/forms/LoginForm';
import { useAuth } from '@/hooks/auth/useAuth';
import { ROUTE_PATHS } from '@/config/routes';
import * as styles from './LoginPage.css';

export const LoginPage = (): JSX.Element => {
  const { isAuthenticated } = useAuth();

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
          <Typography.Text type="secondary">Inventory and purchase management</Typography.Text>
        </Flex>

        <LoginForm />
      </Card>
    </Flex>
  );
};
