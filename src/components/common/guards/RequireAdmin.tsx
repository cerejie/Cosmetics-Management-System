import { Result } from 'antd';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';

/**
 * Client-side gate for admin-only screens. The database enforces the same rule
 * through RLS and the RPC role checks — this only improves the UX.
 */
export const RequireAdmin = (): JSX.Element => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="Admins only"
        subTitle="You do not have permission to view this page."
      />
    );
  }

  return <Outlet />;
};
