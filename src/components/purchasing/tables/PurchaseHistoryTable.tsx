import { Button, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { formatCurrency, formatDate, formatNumber } from '@/utils/common/format';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import {
  TABLE_SCROLL,
  TABLE_STICKY,
  tablePagination,
} from '@/components/common/tables/tableDefaults';
import type { Purchase } from '@/types/purchasing/purchasing.types';

interface PurchaseHistoryTableProps {
  readonly purchases: readonly Purchase[];
  readonly loading: boolean;
  readonly onView: (purchase: Purchase) => void;
}

export const PurchaseHistoryTable = ({
  purchases,
  loading,
  onView,
}: PurchaseHistoryTableProps): JSX.Element => {
  const columns: ColumnsType<Purchase> = [
    {
      title: 'Date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.purchaseDate.localeCompare(b.purchaseDate),
      render: (purchaseDate: string) => formatDate(purchaseDate),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      sorter: (a, b) => a.supplierName.localeCompare(b.supplierName),
      render: (supplierName: string) => <Typography.Text strong>{supplierName}</Typography.Text>,
    },
    {
      title: 'Products',
      key: 'products',
      responsive: ['md'],
      render: (_, purchase) => {
        const [first, ...rest] = purchase.items;
        if (!first) return <Typography.Text type="secondary">—</Typography.Text>;

        return (
          <Space direction="vertical" size={0}>
            <Typography.Text>
              {first.productName} × {formatNumber(first.quantity)}
            </Typography.Text>
            {rest.length > 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                and {rest.length} more
              </Typography.Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Items',
      key: 'items',
      align: 'right',
      render: (_, purchase) =>
        formatNumber(purchase.items.reduce((count, item) => count + item.quantity, 0)),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      sorter: (a, b) => a.total - b.total,
      render: (total: number) => <Typography.Text strong>{formatCurrency(total)}</Typography.Text>,
    },
    {
      title: 'Ref.',
      dataIndex: 'reference',
      key: 'reference',
      responsive: ['lg'],
      render: (reference: string) => (
        <Typography.Text type="secondary">{reference}</Typography.Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 100,
      render: (_, purchase) => (
        <Button type="link" onClick={() => onView(purchase)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <Table<Purchase>
      rowKey="id"
      columns={columns}
      dataSource={purchases as Purchase[]}
      loading={loading}
      pagination={tablePagination('purchases')}
      scroll={TABLE_SCROLL}
      sticky={TABLE_STICKY}
      locale={{
        emptyText: (
          <EmptyState
            title="No purchases found"
            description="Purchases you record will be listed here."
          />
        ),
      }}
    />
  );
};
