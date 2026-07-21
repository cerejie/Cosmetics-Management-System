import { Button, InputNumber, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getStockLevel, type Product } from '@/types/inventory/inventory.types';
import { formatNumber } from '@/utils/common/format';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import {
  TABLE_SCROLL,
  TABLE_STICKY,
  tablePagination,
} from '@/components/common/tables/tableDefaults';

interface LowStockTableProps {
  readonly products: readonly Product[];
  readonly loading: boolean;
  readonly canManage: boolean;
  /** Id of the product whose reorder level is being saved, if any. */
  readonly savingProductId: string | null;
  readonly onReorderLevelChange: (product: Product, reorderLevel: number) => void;
  readonly onOrder: (product: Product) => void;
}

export const LowStockTable = ({
  products,
  loading,
  canManage,
  savingProductId,
  onReorderLevelChange,
  onOrder,
}: LowStockTableProps): JSX.Element => {
  const columns: ColumnsType<Product> = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, product) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{product.name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {product.sku}
            {product.brand && ` · ${product.brand}`}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      responsive: ['lg'],
      render: (categoryName: string | null) =>
        categoryName ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'On hand',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      align: 'right',
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.stockQuantity - b.stockQuantity,
      render: (_, product) => {
        const level = getStockLevel(product);
        return (
          <Space direction="vertical" size={0} align="end">
            <Typography.Text strong type={level === 'out_of_stock' ? 'danger' : 'warning'}>
              {formatNumber(product.stockQuantity)}
            </Typography.Text>
            <Tag
              color={level === 'out_of_stock' ? 'error' : 'warning'}
              style={{ marginInlineEnd: 0 }}
            >
              {level === 'out_of_stock' ? 'Out of stock' : 'Low stock'}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Warn me at',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
      align: 'right',
      width: 160,
      sorter: (a, b) => a.reorderLevel - b.reorderLevel,
      // Editing in place is the point of this screen: the threshold is a
      // judgement call that changes as the shop learns how fast things sell.
      render: (_, product) =>
        canManage ? (
          <InputNumber
            min={0}
            precision={0}
            value={product.reorderLevel}
            disabled={savingProductId !== null && savingProductId !== product.id}
            onChange={(value) => {
              if (value !== null && value !== product.reorderLevel) {
                onReorderLevelChange(product, value);
              }
            }}
            style={{ width: '100%' }}
            aria-label={`Low stock level for ${product.name}`}
          />
        ) : (
          formatNumber(product.reorderLevel)
        ),
    },
    {
      title: 'Short by',
      key: 'shortfall',
      align: 'right',
      render: (_, product) => {
        const shortfall = Math.max(product.reorderLevel - product.stockQuantity, 0);
        return shortfall > 0 ? (
          <Typography.Text strong>{formatNumber(shortfall)}</Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        );
      },
    },
  ];

  if (canManage) {
    columns.push({
      title: '',
      key: 'actions',
      align: 'right',
      width: 130,
      render: (_, product) => (
        <Tooltip title="Start a purchase for this product">
          <Button icon={<ShoppingCartOutlined />} onClick={() => onOrder(product)}>
            Order
          </Button>
        </Tooltip>
      ),
    });
  }

  return (
    <Table<Product>
      rowKey="id"
      columns={columns}
      dataSource={products as Product[]}
      loading={loading}
      pagination={tablePagination('products')}
      scroll={TABLE_SCROLL}
      sticky={TABLE_STICKY}
      locale={{
        emptyText: (
          <EmptyState
            title="Nothing is running low"
            description="Every product is above its low stock level. Raise a level below if you want an earlier warning."
          />
        ),
      }}
    />
  );
};
