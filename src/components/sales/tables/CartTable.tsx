import { Button, Empty, InputNumber, Table, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCartStore } from '@/store/sales/cartStore';
import { formatCurrency } from '@/utils/common/format';
import type { CartLine } from '@/types/sales/sales.types';

export const CartTable = (): JSX.Element => {
  const lines = useCartStore((state) => state.lines);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeLine = useCartStore((state) => state.removeLine);

  const columns: ColumnsType<CartLine> = [
    {
      title: 'Item',
      dataIndex: 'productName',
      key: 'productName',
      render: (_, line) => (
        <>
          <Typography.Text strong>{line.productName}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {line.sku} · {formatCurrency(line.unitPrice)} each
          </Typography.Text>
        </>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      render: (_, line) => (
        <InputNumber
          min={1}
          max={line.availableStock}
          precision={0}
          value={line.quantity}
          onChange={(value) => setQuantity(line.productId, value ?? 1)}
          style={{ width: '100%' }}
          aria-label={`Quantity for ${line.productName}`}
        />
      ),
    },
    {
      title: 'Total',
      key: 'lineTotal',
      align: 'right',
      width: 120,
      render: (_, line) => (
        <Typography.Text strong>{formatCurrency(line.unitPrice * line.quantity)}</Typography.Text>
      ),
    },
    {
      key: 'actions',
      align: 'right',
      width: 56,
      render: (_, line) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLine(line.productId)}
          aria-label={`Remove ${line.productName}`}
        />
      ),
    },
  ];

  return (
    <Table<CartLine>
      rowKey="productId"
      columns={columns}
      dataSource={lines as CartLine[]}
      pagination={false}
      size="small"
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No items yet" />,
      }}
    />
  );
};
