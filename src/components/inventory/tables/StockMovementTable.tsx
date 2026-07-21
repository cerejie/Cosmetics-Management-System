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

const DASH = <Typography.Text type="secondary">—</Typography.Text>;

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
      title: 'On hand before',
      dataIndex: 'quantityBefore',
      key: 'quantityBefore',
      align: 'right',
      responsive: ['md'],
      render: (quantityBefore: number) => formatNumber(quantityBefore),
    },
    {
      title: 'Stock in',
      key: 'stockIn',
      align: 'right',
      render: (_, movement) =>
        movement.quantity > 0 ? (
          <Typography.Text type="success" strong>
            +{formatNumber(movement.quantity)}
          </Typography.Text>
        ) : (
          DASH
        ),
    },
    {
      title: 'Stock out',
      key: 'stockOut',
      align: 'right',
      render: (_, movement) =>
        movement.quantity < 0 ? (
          <Typography.Text type="danger" strong>
            −{formatNumber(-movement.quantity)}
          </Typography.Text>
        ) : (
          DASH
        ),
    },
    {
      title: 'On hand after',
      dataIndex: 'quantityAfter',
      key: 'quantityAfter',
      align: 'right',
      render: (quantityAfter: number) => (
        <Typography.Text strong>{formatNumber(quantityAfter)}</Typography.Text>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      responsive: ['lg'],
      render: (reason: string) => reason || DASH,
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
            description="Purchases, sales and returns will appear here as they happen."
          />
        ),
      }}
    />
  );
};
