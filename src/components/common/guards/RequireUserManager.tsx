import { Result } from 'antd';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';

/** Only roles that can create other accounts may reach the users screen. */
export const RequireUserManager = (): JSX.Element => {
  const { canManageUsers } = useAuth();

  if (!canManageUsers) {
    return (
      <Result
        status="403"
        title="Not available"
        subTitle="You do not have permission to manage users."
      />
    );
  }

  return <Outlet />;
};
