import { Avatar, Dropdown, Typography } from 'antd';
import { LogoutOutlined, UpOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth/authStore';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { ROLE_LABELS } from '@/types/auth/auth.types';
import { ROUTE_PATHS } from '@/config/routes';
import * as styles from './AppLayout.css';

const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/** Signed-in identity, pinned to the bottom of the sidebar. */
export const SidebarAccount = (): JSX.Element => {
  const { user, role } = useAuth();
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();
  const runAction = useAsyncAction();

  const handleSignOut = async (): Promise<void> => {
    await runAction(signOut);
    navigate(ROUTE_PATHS.login, { replace: true });
  };

  const displayName = user?.fullName || user?.email || '';
  const initials = displayName ? getInitials(displayName) : '';

  return (
    <div className={styles.account}>
      <Dropdown
        menu={{
          items: [
            {
              key: 'identity',
              type: 'group',
              label: (
                <span style={{ display: 'block', maxWidth: 200 }}>
                  <Typography.Text strong ellipsis style={{ display: 'block' }}>
                    {displayName}
                  </Typography.Text>
                  {role && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {ROLE_LABELS[role]}
                    </Typography.Text>
                  )}
                </span>
              ),
            },
            { key: 'divider', type: 'divider' },
            { key: 'sign-out', icon: <LogoutOutlined />, label: 'Sign out', danger: true },
          ],
          onClick: ({ key }) => {
            if (key === 'sign-out') void handleSignOut();
          },
        }}
        trigger={['click']}
        placement="topRight"
      >
        <div
          className={styles.accountAction}
          role="button"
          tabIndex={0}
          aria-label={`Account menu for ${displayName}`}
        >
          <Avatar size={32} style={{ backgroundColor: '#fdf2f7', color: '#c2185b', fontSize: 12 }}>
            {initials || <UserOutlined />}
          </Avatar>

          <span className={styles.accountIdentity}>
            <span className={styles.accountName}>{displayName}</span>
            {role && <span className={styles.accountRole}>{ROLE_LABELS[role]}</span>}
          </span>

          <UpOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
        </div>
      </Dropdown>
    </div>
  );
};
