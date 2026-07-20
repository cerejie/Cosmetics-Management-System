import { Button, Popconfirm, Space, Table, Typography } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Category } from '@/types/inventory/inventory.types';

interface CategoryTableProps {
  readonly categories: readonly Category[];
  readonly loading: boolean;
  readonly onEdit: (category: Category) => void;
  readonly onDelete: (category: Category) => void;
}

export const CategoryTable = ({
  categories,
  loading,
  onEdit,
  onDelete,
}: CategoryTableProps): JSX.Element => {
  const columns: ColumnsType<Category> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) =>
        description || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 120,
      render: (_, category) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(category)}
            aria-label={`Edit ${category.name}`}
          />
          <Popconfirm
            title="Delete this category?"
            description="Products in it will be left uncategorised."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(category)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={`Delete ${category.name}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table<Category>
      rowKey="id"
      columns={columns}
      dataSource={categories as Category[]}
      loading={loading}
      pagination={false}
    />
  );
};
