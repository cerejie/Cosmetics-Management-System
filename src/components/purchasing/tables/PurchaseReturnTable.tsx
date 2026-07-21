import { Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { formatCurrency, formatDate, formatNumber } from '@/utils/common/format';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import {
  TABLE_SCROLL,
  TABLE_STICKY,
  tablePagination,
} from '@/components/common/tables/tableDefaults';
import type { PurchaseReturn } from '@/types/purchasing/purchasing.types';

interface PurchaseReturnTableProps {
  readonly returns: readonly PurchaseReturn[];
  readonly loading: boolean;
}

export const PurchaseReturnTable = ({
  returns,
  loading,
}: PurchaseReturnTableProps): JSX.Element => {
  const columns: ColumnsType<PurchaseReturn> = [
    {
      title: 'Date',
      dataIndex: 'returnDate',
      key: 'returnDate',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.returnDate.localeCompare(b.returnDate),
      render: (returnDate: string) => formatDate(returnDate),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      sorter: (a, b) => a.supplierName.localeCompare(b.supplierName),
      render: (supplierName: string) => <Typography.Text strong>{supplierName}</Typography.Text>,
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (productName: string, item) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{productName}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {item.sku}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (quantity: number) => formatNumber(quantity),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      render: (totalAmount: number) => (
        <Typography.Text strong>{formatCurrency(totalAmount)}</Typography.Text>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      responsive: ['md'],
      render: (reason: string) => reason || <Typography.Text type="secondary">—</Typography.Text>,
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
  ];

  return (
    <Table<PurchaseReturn>
      rowKey="id"
      columns={columns}
      dataSource={returns as PurchaseReturn[]}
      loading={loading}
      pagination={tablePagination('returns')}
      scroll={TABLE_SCROLL}
      sticky={TABLE_STICKY}
      locale={{
        emptyText: (
          <EmptyState
            title="No returns yet"
            description="Goods you send back to a supplier will be listed here."
          />
        ),
      }}
    />
  );
};
