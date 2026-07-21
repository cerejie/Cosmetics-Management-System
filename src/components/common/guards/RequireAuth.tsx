import { Flex, Spin } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth/authStore';
import { ROUTE_PATHS } from '@/config/routes';

export const RequireAuth = (): JSX.Element => {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!user) {
    return <Navigate to={ROUTE_PATHS.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
