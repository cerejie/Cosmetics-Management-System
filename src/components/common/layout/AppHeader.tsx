import { Avatar, Dropdown, Layout, Space, Tag, Typography } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth/authStore';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { ROLE_LABELS, type AppRole } from '@/types/auth/auth.types';
import { ROUTE_PATHS } from '@/config/routes';
import * as styles from './AppLayout.css';

const { Header } = Layout;

const ROLE_COLORS: Readonly<Record<AppRole, string>> = {
  superadmin: 'purple',
  admin: 'magenta',
  employee: 'default',
};

export const AppHeader = (): JSX.Element => {
  const { user, role } = useAuth();
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();
  const runAction = useAsyncAction();

  const handleSignOut = async (): Promise<void> => {
    await runAction(signOut);
    navigate(ROUTE_PATHS.login, { replace: true });
  };

  return (
    <Header className={styles.header}>
      <Typography.Text type="secondary">
        {user ? `Signed in as ${user.fullName || user.email}` : ''}
      </Typography.Text>

      <Dropdown
        menu={{
          items: [{ key: 'sign-out', icon: <LogoutOutlined />, label: 'Sign out', danger: true }],
          onClick: handleSignOut,
        }}
        trigger={['click']}
      >
        <Space style={{ cursor: 'pointer' }}>
          <Avatar icon={<UserOutlined />} />
          {role && <Tag color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Tag>}
        </Space>
      </Dropdown>
    </Header>
  );
};
