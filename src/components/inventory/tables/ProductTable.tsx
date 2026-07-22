import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, FireOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getStockLevel, type Product, type StockLevel } from '@/types/inventory/inventory.types';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import {
  TABLE_SCROLL,
  TABLE_STICKY,
  tablePagination,
} from '@/components/common/tables/tableDefaults';

const STOCK_TAGS: Readonly<Record<StockLevel, { color: string; label: string }>> = {
  out_of_stock: { color: 'error', label: 'Out of stock' },
  low_stock: { color: 'warning', label: 'Low stock' },
  in_stock: { color: 'success', label: 'In stock' },
};

interface ProductTableProps {
  readonly products: readonly Product[];
  readonly loading: boolean;
  readonly canManage: boolean;
  readonly onEdit: (product: Product) => void;
  readonly onDelete: (product: Product) => void;
  /** Opens the typed-confirmation dialog; it does not delete anything itself. */
  readonly onForceDelete: (product: Product) => void;
}

export const ProductTable = ({
  products,
  loading,
  canManage,
  onEdit,
  onDelete,
  onForceDelete,
}: ProductTableProps): JSX.Element => {
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
      responsive: ['md'],
      render: (categoryName: string | null) =>
        categoryName ? <Tag>{categoryName}</Tag> : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      sorter: (a, b) => a.unitPrice - b.unitPrice,
      render: (unitPrice: number) => formatCurrency(unitPrice),
    },
    {
      title: 'Stock',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      align: 'right',
      sorter: (a, b) => a.stockQuantity - b.stockQuantity,
      render: (_, product) => {
        const level = getStockLevel(product);
        return (
          <Space direction="vertical" size={0} align="end">
            <Typography.Text strong>{formatNumber(product.stockQuantity)}</Typography.Text>
            <Tag color={STOCK_TAGS[level].color} style={{ marginInlineEnd: 0 }}>
              {STOCK_TAGS[level].label}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      responsive: ['lg'],
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'blue' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 150,
      render: (_, product) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(product)}
              aria-label={`Edit ${product.name}`}
            />
          </Tooltip>
          <Popconfirm
            title="Remove this product?"
            description="If it appears in past sales or purchases it is marked inactive instead, so those records stay readable."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(product)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={`Delete ${product.name}`}
            />
          </Popconfirm>
          <Tooltip title="Delete permanently">
            <Button
              type="text"
              danger
              icon={<FireOutlined />}
              onClick={() => onForceDelete(product)}
              aria-label={`Permanently delete ${product.name}`}
            />
          </Tooltip>
        </Space>
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
            title="No products match these filters"
            description="Try a different search term, or clear the category and low-stock filters."
          />
        ),
      }}
    />
  );
};
