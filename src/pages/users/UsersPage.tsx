import { Button, Card } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { UserTable } from '@/components/users/tables/UserTable';
import { CreateUserModal } from '@/components/users/modals/CreateUserModal';
import { useUserStore } from '@/store/users/userStore';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import type { ManagedUser } from '@/types/users/users.types';

const DESCRIPTIONS: Readonly<Record<string, string>> = {
  superadmin: 'Add admins and employees, and control who has access.',
  admin: 'Add employees and control who has access.',
};

export const UsersPage = (): JSX.Element => {
  const users = useUserStore((state) => state.users);
  const status = useUserStore((state) => state.status);
  const error = useUserStore((state) => state.error);
  const loadUsers = useUserStore((state) => state.loadUsers);
  const openCreateForm = useUserStore((state) => state.openCreateForm);
  const setUserRole = useUserStore((state) => state.setUserRole);
  const { role, user } = useAuth();
  const runAction = useAsyncAction();

  useMountEffect(() => {
    void loadUsers();
  });

  const handleToggleActive = (target: ManagedUser, isActive: boolean): void => {
    void runAction(
      () => setUserRole(target.id, target.role, isActive),
      isActive ? `${target.fullName} can sign in again.` : `${target.fullName} has been disabled.`,
    );
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadUsers()} />;
  }

  return (
    <>
      <PageHeader
        title="Users"
        description={role ? DESCRIPTIONS[role] : undefined}
        extra={
          <Button type="primary" icon={<UserAddOutlined />} onClick={openCreateForm}>
            Add user
          </Button>
        }
      />

      <Card variant="outlined">
        <UserTable
          users={users}
          loading={status === 'loading'}
          actorRole={role}
          actorId={user?.id}
          onToggleActive={handleToggleActive}
        />
      </Card>

      <CreateUserModal />
    </>
  );
};
