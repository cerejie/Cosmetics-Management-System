import { Button, Popconfirm, Space, Switch, Table, Tag, Typography } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  APPROVAL_STATUS_LABELS,
  ROLE_LABELS,
  canManageRole,
  type AppRole,
  type ApprovalStatus,
} from '@/types/auth/auth.types';
import { formatDate } from '@/utils/common/format';
import type { ManagedUser } from '@/types/users/users.types';

const ROLE_COLORS: Readonly<Record<AppRole, string>> = {
  superadmin: 'purple',
  admin: 'magenta',
  employee: 'default',
};

const APPROVAL_COLORS: Readonly<Record<ApprovalStatus, string>> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
};

interface UserTableProps {
  readonly users: readonly ManagedUser[];
  readonly loading: boolean;
  readonly actorRole: AppRole | undefined;
  readonly actorId: string | undefined;
  readonly onToggleActive: (user: ManagedUser, isActive: boolean) => void;
  readonly onDecide: (user: ManagedUser, status: Exclude<ApprovalStatus, 'pending'>) => void;
  readonly onResetPassword: (user: ManagedUser) => void;
}

export const UserTable = ({
  users,
  loading,
  actorRole,
  actorId,
  onToggleActive,
  onDecide,
  onResetPassword,
}: UserTableProps): JSX.Element => {
  // You can only act on roles strictly below your own, and never on yourself.
  const isEditable = (user: ManagedUser): boolean =>
    user.id !== actorId && canManageRole(actorRole, user.role);

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
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      filters: Object.entries(APPROVAL_STATUS_LABELS).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.approvalStatus === value,
      defaultSortOrder: 'ascend',
      // Self-registered accounts need attention, so they sort to the top.
      sorter: (a, b) =>
        Number(b.approvalStatus === 'pending') - Number(a.approvalStatus === 'pending'),
      render: (status: ApprovalStatus, user) => {
        if (status !== 'pending') {
          return <Tag color={APPROVAL_COLORS[status]}>{APPROVAL_STATUS_LABELS[status]}</Tag>;
        }

        if (!isEditable(user)) {
          return <Tag color={APPROVAL_COLORS.pending}>{APPROVAL_STATUS_LABELS.pending}</Tag>;
        }

        return (
          <Space size="small">
            <Button size="small" type="primary" onClick={() => onDecide(user, 'approved')}>
              Approve
            </Button>
            <Popconfirm
              title="Reject this request?"
              description="They will not be able to sign in."
              okText="Reject"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDecide(user, 'rejected')}
            >
              <Button size="small" danger>
                Reject
              </Button>
            </Popconfirm>
          </Space>
        );
      },
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
        if (!isEditable(user)) {
          return <Tag color={isActive ? 'blue' : 'default'}>{isActive ? 'Active' : 'Disabled'}</Tag>;
        }

        return (
          <Popconfirm
            title={isActive ? 'Disable this account?' : 'Re-enable this account?'}
            description={
              isActive
                ? 'They will be unable to sign in once their current session expires.'
                : 'They will be able to log in again.'
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
    {
      title: 'Password',
      key: 'password',
      align: 'right',
      render: (_, user) =>
        isEditable(user) ? (
          <Button size="small" icon={<KeyOutlined />} onClick={() => onResetPassword(user)}>
            Reset
          </Button>
        ) : null,
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
