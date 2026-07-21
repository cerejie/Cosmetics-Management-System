import { Button, Descriptions, Flex, Modal, Table, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { formatCurrency, formatDate, formatNumber } from '@/utils/common/format';
import type { PurchaseItem } from '@/types/purchasing/purchasing.types';

const columns: ColumnsType<PurchaseItem> = [
  {
    title: 'Product',
    dataIndex: 'productName',
    key: 'productName',
    render: (productName: string, item) => (
      <Flex vertical>
        <Typography.Text>{productName}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {item.sku}
        </Typography.Text>
      </Flex>
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
    title: 'Cost each',
    dataIndex: 'unitCost',
    key: 'unitCost',
    align: 'right',
    render: (unitCost: number) => formatCurrency(unitCost),
  },
  {
    title: 'Total',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    align: 'right',
    render: (lineTotal: number) => (
      <Typography.Text strong>{formatCurrency(lineTotal)}</Typography.Text>
    ),
  },
];

export const PurchaseDetailModal = (): JSX.Element => {
  const purchase = usePurchaseStore((state) => state.detailPurchase);
  const closeDetail = usePurchaseStore((state) => state.closeDetail);

  return (
    <Modal
      title={purchase ? `Purchase ${purchase.reference}` : 'Purchase'}
      open={purchase !== null}
      onCancel={closeDetail}
      width={700}
      destroyOnHidden
      footer={
        <Flex justify="end" gap={8}>
          <Button size="large" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print
          </Button>
          <Button size="large" type="primary" onClick={closeDetail}>
            Close
          </Button>
        </Flex>
      }
    >
      {purchase && (
        <>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Supplier">{purchase.supplierName}</Descriptions.Item>
            <Descriptions.Item label="Date">{formatDate(purchase.purchaseDate)}</Descriptions.Item>
            <Descriptions.Item label="Recorded by">
              {purchase.createdByName ?? '—'}
            </Descriptions.Item>
            {purchase.note && (
              <Descriptions.Item label="Notes" span={2}>
                {purchase.note}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Table<PurchaseItem>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={purchase.items as PurchaseItem[]}
            pagination={false}
          />

          <Flex justify="end" style={{ marginTop: 16 }}>
            <Typography.Text strong style={{ fontSize: 18 }}>
              Total {formatCurrency(purchase.total)}
            </Typography.Text>
          </Flex>
        </>
      )}
    </Modal>
  );
};
