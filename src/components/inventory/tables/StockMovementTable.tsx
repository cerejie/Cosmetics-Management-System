import { Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { StockMovement, StockMovementType } from '@/types/inventory/inventory.types';
import { STOCK_MOVEMENT_LABELS } from '@/config/constants';
import { formatDateTime, formatNumber } from '@/utils/common/format';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import {
  TABLE_SCROLL,
  TABLE_STICKY,
  tablePagination,
} from '@/components/common/tables/tableDefaults';

const TYPE_COLORS: Readonly<Record<StockMovementType, string>> = {
  purchase: 'green',
  adjustment: 'blue',
  sale: 'magenta',
  sale_reversal: 'orange',
  purchase_return: 'volcano',
};

interface StockMovementTableProps {
  readonly movements: readonly StockMovement[];
  readonly loading: boolean;
}

export const StockMovementTable = ({
  movements,
  loading,
}: StockMovementTableProps): JSX.Element => {
  const columns: ColumnsType<StockMovement> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (productName: string) => <Typography.Text strong>{productName}</Typography.Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: Object.entries(STOCK_MOVEMENT_LABELS).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.type === value,
      render: (type: StockMovementType) => (
        <Tag color={TYPE_COLORS[type]}>{STOCK_MOVEMENT_LABELS[type]}</Tag>
      ),
    },
    {
      title: 'Change',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (quantity: number) => (
        <Typography.Text type={quantity > 0 ? 'success' : 'danger'} strong>
          {quantity > 0 ? '+' : ''}
          {formatNumber(quantity)}
        </Typography.Text>
      ),
    },
    {
      title: 'On hand after',
      dataIndex: 'quantityAfter',
      key: 'quantityAfter',
      align: 'right',
      responsive: ['md'],
      render: (quantityAfter: number) => formatNumber(quantityAfter),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      responsive: ['lg'],
      render: (reason: string) => reason || <Typography.Text type="secondary">—</Typography.Text>,
    },
  ];

  return (
    <Table<StockMovement>
      rowKey="id"
      columns={columns}
      dataSource={movements as StockMovement[]}
      loading={loading}
      pagination={tablePagination('movements', 15)}
      scroll={TABLE_SCROLL}
      sticky={TABLE_STICKY}
      locale={{
        emptyText: (
          <EmptyState
            title="No stock movements yet"
            description="Adjustments, purchases and restocks will appear here as they happen."
          />
        ),
      }}
    />
  );
};
