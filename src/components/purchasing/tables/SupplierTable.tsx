import { Button, Popconfirm, Space, Table, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PrinterOutlined } from '@ant-design/icons';
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
  /** Prints a statement of every purchase made from this supplier. */
  readonly onPrint: (supplier: Supplier) => void;
}

export const SupplierTable = ({
  suppliers,
  loading,
  onEdit,
  onDelete,
  onPrint,
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
      title: 'TIN',
      dataIndex: 'tin',
      key: 'tin',
      responsive: ['lg'],
      render: (tin: string) => tin || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      responsive: ['xl'],
      render: (address: string) =>
        address || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 230,
      render: (_, supplier) => (
        <Space size="small">
          <Tooltip title="Print a statement of purchases from this supplier">
            <Button
              icon={<PrinterOutlined />}
              onClick={() => onPrint(supplier)}
              aria-label={`Print a statement for ${supplier.name}`}
            />
          </Tooltip>
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
