import { Button, Popconfirm, Space, Table, Typography } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import {
  TABLE_SCROLL,
  TABLE_STICKY,
  tablePagination,
} from '@/components/common/tables/tableDefaults';
import type { Supplier } from '@/types/purchasing/purchasing.types';

interface SupplierTableProps {
  readonly suppliers: readonly Supplier[];
  readonly loading: boolean;
  readonly onEdit: (supplier: Supplier) => void;
  readonly onDelete: (supplier: Supplier) => void;
}

export const SupplierTable = ({
  suppliers,
  loading,
  onEdit,
  onDelete,
}: SupplierTableProps): JSX.Element => {
  const columns: ColumnsType<Supplier> = [
    {
      title: 'Supplier',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: 'Contact person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      render: (contactPerson: string) =>
        contactPerson || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'],
      render: (email: string) =>
        email ? <a href={`mailto:${email}`}>{email}</a> : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      responsive: ['lg'],
      render: (address: string) =>
        address || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 190,
      render: (_, supplier) => (
        <Space size="small">
          <Button icon={<EditOutlined />} onClick={() => onEdit(supplier)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this supplier?"
            description="This cannot be undone."
            okText="Delete"
            cancelText="Keep"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(supplier)}
          >
            <Button danger icon={<DeleteOutlined />} aria-label={`Delete ${supplier.name}`} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table<Supplier>
      rowKey="id"
      columns={columns}
      dataSource={suppliers as Supplier[]}
      loading={loading}
      pagination={tablePagination('suppliers')}
      scroll={TABLE_SCROLL}
      sticky={TABLE_STICKY}
      locale={{
        emptyText: (
          <EmptyState
            title="No suppliers yet"
            description="Add the businesses you buy your stock from."
          />
        ),
      }}
    />
  );
};
