import { Button, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PAYMENT_METHOD_LABELS } from '@/config/constants';
import { formatCurrency, formatDateTime } from '@/utils/common/format';
import type { PaymentMethod, Sale } from '@/types/sales/sales.types';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import {
  TABLE_SCROLL,
  TABLE_STICKY,
  tablePagination,
} from '@/components/common/tables/tableDefaults';

interface SalesTableProps {
  readonly sales: readonly Sale[];
  readonly loading: boolean;
  readonly onViewDetail: (sale: Sale) => void;
  readonly onPrint: (sale: Sale) => void;
}

export const SalesTable = ({
  sales,
  loading,
  onViewDetail,
  onPrint,
}: SalesTableProps): JSX.Element => {
  const columns: ColumnsType<Sale> = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: (reference: string) => <Typography.Text strong>{reference}</Typography.Text>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      responsive: ['md'],
      render: (customerName: string) =>
        customerName || <Typography.Text type="secondary">Walk-in</Typography.Text>,
    },
    {
      title: 'Items',
      key: 'items',
      align: 'right',
      responsive: ['lg'],
      render: (_, sale) => sale.items.reduce((count, item) => count + item.quantity, 0),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      responsive: ['lg'],
      render: (paymentMethod: PaymentMethod) => <Tag>{PAYMENT_METHOD_LABELS[paymentMethod]}</Tag>,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      sorter: (a, b) => a.total - b.total,
      render: (total: number, sale) => (
        <Typography.Text
          strong
          delete={sale.status === 'voided'}
          type={sale.status === 'voided' ? 'secondary' : undefined}
        >
          {formatCurrency(total)}
        </Typography.Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'Voided', value: 'voided' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: Sale['status']) => (
        <Tag color={status === 'completed' ? 'success' : 'default'}>
          {status === 'completed' ? 'Completed' : 'Voided'}
        </Tag>
      ),
    },
    {
      key: 'actions',
      align: 'right',
      render: (_, sale) => (
        <Space size="small">
          <Tooltip title="Print invoice">
            <Button
              type="text"
              icon={<PrinterOutlined />}
              onClick={() => onPrint(sale)}
              aria-label={`Print invoice ${sale.reference}`}
            />
          </Tooltip>
          <Button type="link" onClick={() => onViewDetail(sale)}>
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table<Sale>
      rowKey="id"
      columns={columns}
      dataSource={sales as Sale[]}
      loading={loading}
      pagination={tablePagination('purchases')}
      scroll={TABLE_SCROLL}
      sticky={TABLE_STICKY}
      locale={{
        emptyText: (
          <EmptyState
            title="No purchases recorded"
            description="Completed purchases will show up here once you record the first one."
          />
        ),
      }}
    />
  );
};
