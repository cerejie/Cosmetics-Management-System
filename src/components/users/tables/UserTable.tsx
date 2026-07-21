import { Popconfirm, Space, Switch, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ROLE_LABELS, canManageRole, type AppRole } from '@/types/auth/auth.types';
import { formatDate } from '@/utils/common/format';
import type { ManagedUser } from '@/types/users/users.types';

const ROLE_COLORS: Readonly<Record<AppRole, string>> = {
  superadmin: 'purple',
  admin: 'magenta',
  employee: 'default',
};

interface UserTableProps {
  readonly users: readonly ManagedUser[];
  readonly loading: boolean;
  readonly actorRole: AppRole | undefined;
  readonly actorId: string | undefined;
  readonly onToggleActive: (user: ManagedUser, isActive: boolean) => void;
}

export const UserTable = ({
  users,
  loading,
  actorRole,
  actorId,
  onToggleActive,
}: UserTableProps): JSX.Element => {
  const columns: ColumnsType<ManagedUser> = [
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (_, user) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>
            {user.fullName || <Typography.Text type="secondary">Unnamed</Typography.Text>}
            {user.id === actorId && (
              <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
                {' '}
                (you)
              </Typography.Text>
            )}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            @{user.username}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: Object.entries(ROLE_LABELS).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.role === value,
      render: (role: AppRole) => <Tag color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Tag>,
    },
    {
      title: 'Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['md'],
      render: (createdAt: string) => formatDate(createdAt),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'right',
      render: (isActive: boolean, user) => {
        // You can only act on roles strictly below your own, and never on yourself.
        const editable = user.id !== actorId && canManageRole(actorRole, user.role);

        if (!editable) {
          return <Tag color={isActive ? 'blue' : 'default'}>{isActive ? 'Active' : 'Disabled'}</Tag>;
        }

        return (
          <Popconfirm
            title={isActive ? 'Disable this account?' : 'Re-enable this account?'}
            description={
              isActive ? 'They will be signed out and unable to log in.' : 'They will be able to log in again.'
            }
            okText={isActive ? 'Disable' : 'Enable'}
            okButtonProps={{ danger: isActive }}
            onConfirm={() => onToggleActive(user, !isActive)}
          >
            <Switch checked={isActive} aria-label={`Toggle access for ${user.fullName}`} />
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Table<ManagedUser>
      rowKey="id"
      columns={columns}
      dataSource={users as ManagedUser[]}
      loading={loading}
      pagination={false}
      scroll={{ x: 'max-content' }}
    />
  );
};
