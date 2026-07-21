import { Badge, Button, Progress, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { LineChartOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatNumber } from '@/utils/common/format';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import {
  TABLE_SCROLL,
  TABLE_STICKY,
  tablePagination,
} from '@/components/common/tables/tableDefaults';
import {
  isOrderable,
  type OrderSuggestion,
  type SuggestionPriority,
} from '@/utils/purchasing/orderSuggestions';

const PRIORITY_BADGES: Readonly<
  Record<SuggestionPriority, { status: 'error' | 'warning' | 'success'; label: string }>
> = {
  critical: { status: 'error', label: 'Critical' },
  warning: { status: 'warning', label: 'Watch' },
  healthy: { status: 'success', label: 'Planned' },
};

interface SuggestionTableProps {
  readonly suggestions: readonly OrderSuggestion[];
  readonly loading: boolean;
  readonly selectedIds: readonly string[];
  readonly onSelectionChange: (ids: readonly string[]) => void;
  readonly onViewTrend: (suggestion: OrderSuggestion) => void;
  readonly onAddToPurchase: (suggestion: OrderSuggestion) => void;
}

export const SuggestionTable = ({
  suggestions,
  loading,
  selectedIds,
  onSelectionChange,
  onViewTrend,
  onAddToPurchase,
}: SuggestionTableProps): JSX.Element => {
  const columns: ColumnsType<OrderSuggestion> = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      filters: [
        { text: 'Critical', value: 'critical' },
        { text: 'Watch', value: 'warning' },
        { text: 'Planned', value: 'healthy' },
      ],
      onFilter: (value, record) => record.priority === value,
      render: (priority: SuggestionPriority) => (
        <Badge status={PRIORITY_BADGES[priority].status} text={PRIORITY_BADGES[priority].label} />
      ),
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (productName: string, suggestion) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{productName}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {suggestion.sku}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      align: 'right',
      sorter: (a, b) => a.currentStock - b.currentStock,
      render: (currentStock: number) => formatNumber(currentStock),
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
      align: 'right',
      responsive: ['lg'],
      render: (reorderLevel: number) => formatNumber(reorderLevel),
    },
    {
      title: 'Avg Daily Sales',
      dataIndex: 'averageDailySales',
      key: 'averageDailySales',
      align: 'right',
      responsive: ['md'],
      sorter: (a, b) => a.averageDailySales - b.averageDailySales,
      render: (averageDailySales: number) => averageDailySales.toFixed(2),
    },
    {
      title: 'Days Remaining',
      dataIndex: 'daysRemaining',
      key: 'daysRemaining',
      align: 'right',
      sorter: (a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity),
      render: (daysRemaining: number | null) =>
        daysRemaining === null ? (
          <Typography.Text type="secondary">—</Typography.Text>
        ) : (
          formatNumber(Math.round(daysRemaining))
        ),
    },
    {
      title: 'Suggested Qty',
      dataIndex: 'suggestedQuantity',
      key: 'suggestedQuantity',
      align: 'right',
      sorter: (a, b) => a.suggestedQuantity - b.suggestedQuantity,
      render: (suggestedQuantity: number) =>
        suggestedQuantity > 0 ? (
          <Typography.Text strong>{formatNumber(suggestedQuantity)}</Typography.Text>
        ) : (
          <Tooltip title="Stock already covers the expected demand">
            <Typography.Text type="secondary">—</Typography.Text>
          </Tooltip>
        ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      responsive: ['lg'],
      render: (supplierName: string | null) =>
        supplierName ? <Tag>{supplierName}</Tag> : <Typography.Text type="secondary">No history</Typography.Text>,
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 130,
      sorter: (a, b) => a.confidence - b.confidence,
      render: (confidence: number) => (
        <Tooltip title="How much sales and supplier history backs this recommendation">
          <Progress percent={confidence} size="small" showInfo format={(value) => `${value}%`} />
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 130,
      render: (_, suggestion) => (
        <Space size="small">
          <Tooltip title="View trend">
            <Button
              type="text"
              icon={<LineChartOutlined />}
              onClick={() => onViewTrend(suggestion)}
              aria-label={`View trend for ${suggestion.productName}`}
            />
          </Tooltip>
          <Tooltip
            title={
              isOrderable(suggestion)
                ? 'Add to purchase'
                : 'Nothing to order — stock covers the expected demand'
            }
          >
            <Button
              type="text"
              icon={<PlusOutlined />}
              disabled={!isOrderable(suggestion)}
              onClick={() => onAddToPurchase(suggestion)}
              aria-label={`Add ${suggestion.productName} to a purchase`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<OrderSuggestion>
      rowKey="productId"
      columns={columns}
      dataSource={suggestions as OrderSuggestion[]}
      loading={loading}
      rowSelection={{
        selectedRowKeys: selectedIds as string[],
        onChange: (keys) => onSelectionChange(keys as string[]),
      }}
      pagination={tablePagination('suggestions')}
      scroll={TABLE_SCROLL}
      sticky={TABLE_STICKY}
      locale={{
        emptyText: (
          <EmptyState
            title="No products to rank"
            description="Add active products to your catalogue, then generate suggestions again."
          />
        ),
      }}
    />
  );
};
