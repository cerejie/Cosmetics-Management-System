import { Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { CategoryTable } from '@/components/inventory/tables/CategoryTable';
import { CategoryFormModal } from '@/components/inventory/modals/CategoryFormModal';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import type { Category } from '@/types/inventory/inventory.types';

export const CategoriesPage = (): JSX.Element => {
  const categories = useCategoryStore((state) => state.categories);
  const status = useCategoryStore((state) => state.status);
  const error = useCategoryStore((state) => state.error);
  const loadCategories = useCategoryStore((state) => state.loadCategories);
  const openCreateForm = useCategoryStore((state) => state.openCreateForm);
  const openEditForm = useCategoryStore((state) => state.openEditForm);
  const deleteCategory = useCategoryStore((state) => state.deleteCategory);
  const runAction = useAsyncAction();

  useMountEffect(() => {
    void loadCategories();
  });

  const handleDelete = (category: Category): void => {
    void runAction(() => deleteCategory(category.id), `${category.name} deleted.`);
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadCategories()} />;
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group products so they are easier to find and report on."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
            New category
          </Button>
        }
      />

      <Card variant="outlined">
        <CategoryTable
          categories={categories}
          loading={status === 'loading'}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      </Card>

      <CategoryFormModal />
    </>
  );
};
