import { Button, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { hasCustomerDetails, type Customer } from '@/types/sales/customers.types';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import {
  TABLE_SCROLL,
  TABLE_STICKY,
  tablePagination,
} from '@/components/common/tables/tableDefaults';

const DASH = <Typography.Text type="secondary">—</Typography.Text>;

interface CustomerTableProps {
  readonly customers: readonly Customer[];
  readonly loading: boolean;
  readonly canDelete: boolean;
  readonly onEdit: (customer: Customer) => void;
  readonly onDelete: (customer: Customer) => void;
}

export const CustomerTable = ({
  customers,
  loading,
  canDelete,
  onEdit,
  onDelete,
}: CustomerTableProps): JSX.Element => {
  const columns: ColumnsType<Customer> = [
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      // Customers created at the till have a name and nothing else. Saying so
      // turns the list into a to-do rather than a wall of dashes.
      title: 'Details',
      key: 'details',
      filters: [
        { text: 'No information yet', value: 'incomplete' },
        { text: 'Has details', value: 'complete' },
      ],
      onFilter: (value, record) =>
        value === 'complete' ? hasCustomerDetails(record) : !hasCustomerDetails(record),
      render: (_, customer) =>
        hasCustomerDetails(customer) ? (
          <Tag color="success">On file</Tag>
        ) : (
          <Tag color="warning">No information yet</Tag>
        ),
    },
    {
      title: 'Contact number',
      dataIndex: 'contactNumber',
      key: 'contactNumber',
      render: (contactNumber: string) => contactNumber || DASH,
    },
    {
      title: 'TIN',
      dataIndex: 'tin',
      key: 'tin',
      responsive: ['md'],
      render: (tin: string) => tin || DASH,
    },
    {
      title: 'Contact person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      responsive: ['lg'],
      render: (contactPerson: string) => contactPerson || DASH,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      responsive: ['xl'],
      render: (address: string) => address || DASH,
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 160,
      render: (_, customer) => (
        <Space size="small">
          <Button icon={<EditOutlined />} onClick={() => onEdit(customer)}>
            Edit
          </Button>
          {canDelete && (
            <Popconfirm
              title="Delete this customer?"
              description="Past sales keep their own copy of these details and stay readable."
              okText="Delete"
              cancelText="Keep"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(customer)}
            >
              <Button danger icon={<DeleteOutlined />} aria-label={`Delete ${customer.name}`} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table<Customer>
      rowKey="id"
      columns={columns}
      dataSource={customers as Customer[]}
      loading={loading}
      pagination={tablePagination('customers')}
      scroll={TABLE_SCROLL}
      sticky={TABLE_STICKY}
      locale={{
        emptyText: (
          <EmptyState
            title="No customers yet"
            description="Customers are added automatically when you name one on a sale, or you can add them here."
          />
        ),
      }}
    />
  );
};
