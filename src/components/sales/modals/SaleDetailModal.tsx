import {
  Descriptions,
  Divider,
  Flex,
  Modal,
  Popconfirm,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSalesStore } from '@/store/sales/salesStore';
import { useProductStore } from '@/store/inventory/productStore';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { PAYMENT_METHOD_LABELS } from '@/config/constants';
import { formatCurrency, formatDateTime } from '@/utils/common/format';
import type { SaleItem } from '@/types/sales/sales.types';

const itemColumns: ColumnsType<SaleItem> = [
  {
    title: 'Item',
    dataIndex: 'productName',
    key: 'productName',
    render: (_, item) => (
      <>
        <Typography.Text>{item.productName}</Typography.Text>
        <br />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {item.sku}
        </Typography.Text>
      </>
    ),
  },
  {
    title: 'Unit price',
    dataIndex: 'unitPrice',
    key: 'unitPrice',
    align: 'right',
    render: (unitPrice: number) => formatCurrency(unitPrice),
  },
  { title: 'Qty', dataIndex: 'quantity', key: 'quantity', align: 'right' },
  {
    title: 'Total',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    align: 'right',
    render: (lineTotal: number) => <Typography.Text strong>{formatCurrency(lineTotal)}</Typography.Text>,
  },
];

export const SaleDetailModal = (): JSX.Element => {
  const sale = useSalesStore((state) => state.detailSale);
  const closeDetail = useSalesStore((state) => state.closeDetail);
  const voidSale = useSalesStore((state) => state.voidSale);
  const loadProducts = useProductStore((state) => state.loadProducts);
  const { isAdmin } = useAuth();
  const runAction = useAsyncAction();

  const handleVoid = async (): Promise<void> => {
    if (!sale) return;

    const result = await runAction(
      () => voidSale(sale.id, 'Voided from purchase history'),
      `Purchase ${sale.reference} voided and stock restored.`,
    );

    // Voiding returns stock, so the product catalogue is now stale.
    if (result.ok) await loadProducts();
  };

  const canVoid = isAdmin && sale?.status === 'completed';

  return (
    <Modal
      title={sale ? `Purchase ${sale.reference}` : 'Purchase'}
      open={sale !== null}
      onCancel={closeDetail}
      footer={null}
      width={720}
      destroyOnHidden
    >
      {sale && (
        <>
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            <Descriptions.Item label="Date">{formatDateTime(sale.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={sale.status === 'completed' ? 'success' : 'default'}>
                {sale.status === 'completed' ? 'Completed' : 'Voided'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Customer">{sale.customerName || 'Walk-in'}</Descriptions.Item>
            <Descriptions.Item label="Payment">
              {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
            </Descriptions.Item>
            <Descriptions.Item label="Cashier">{sale.createdByName ?? '—'}</Descriptions.Item>
            {sale.note && <Descriptions.Item label="Note">{sale.note}</Descriptions.Item>}
          </Descriptions>

          <Divider />

          <Table<SaleItem>
            rowKey="id"
            columns={itemColumns}
            dataSource={sale.items as SaleItem[]}
            pagination={false}
            size="small"
          />

          <Flex vertical align="flex-end" gap={4} style={{ marginTop: 16 }}>
            <Typography.Text type="secondary">
              Subtotal: {formatCurrency(sale.subtotal)}
            </Typography.Text>
            <Typography.Text type="secondary">
              Discount: −{formatCurrency(sale.discountAmount)}
            </Typography.Text>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Total: {formatCurrency(sale.total)}
            </Typography.Title>
          </Flex>

          {canVoid && (
            <>
              <Divider />
              <Popconfirm
                title="Void this purchase?"
                description="Stock will be returned to inventory. This cannot be undone."
                okText="Void purchase"
                okButtonProps={{ danger: true }}
                onConfirm={handleVoid}
              >
                <Typography.Link type="danger">Void this purchase</Typography.Link>
              </Popconfirm>
            </>
          )}
        </>
      )}
    </Modal>
  );
};
