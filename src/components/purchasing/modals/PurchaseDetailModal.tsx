import { Button, Descriptions, Flex, Modal, Table, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useStoreProfileStore } from '@/store/settings/storeProfileStore';
import { formatCurrency, formatDate, formatNumber } from '@/utils/common/format';
import { printInvoice } from '@/utils/common/invoiceHtml';
import { toPurchaseInvoice } from '@/utils/purchasing/purchaseInvoice';
import { paymentMethodLabel, type PurchaseItem } from '@/types/purchasing/purchasing.types';

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
    title: 'Discount',
    dataIndex: 'discountAmount',
    key: 'discountAmount',
    align: 'right',
    render: (discountAmount: number) =>
      discountAmount > 0 ? formatCurrency(discountAmount) : '—',
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
  const suppliers = useSupplierStore((state) => state.suppliers);
  const profile = useStoreProfileStore((state) => state.profile);

  const handlePrint = (): void => {
    if (!purchase) return;

    const supplier = suppliers.find((candidate) => candidate.id === purchase.supplierId) ?? null;
    printInvoice(toPurchaseInvoice(purchase, supplier, profile));
  };

  return (
    <Modal
      title={purchase ? `Purchase ${purchase.reference}` : 'Purchase'}
      open={purchase !== null}
      onCancel={closeDetail}
      width={700}
      destroyOnHidden
      footer={
        <Flex justify="end" gap={8}>
          <Button size="large" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print invoice
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
            {purchase.invoiceNumber && (
              <Descriptions.Item label="Invoice no.">{purchase.invoiceNumber}</Descriptions.Item>
            )}
            {purchase.referenceNo && (
              <Descriptions.Item label="Reference">{purchase.referenceNo}</Descriptions.Item>
            )}
            {purchase.paymentMethod && (
              <Descriptions.Item label="Paid by">
                {paymentMethodLabel(purchase.paymentMethod)}
              </Descriptions.Item>
            )}
            {purchase.paymentTerms && (
              <Descriptions.Item label="Terms">{purchase.paymentTerms}</Descriptions.Item>
            )}
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

          <Flex vertical align="end" gap={4} style={{ marginTop: 16 }}>
            {purchase.discountAmount > 0 && (
              <>
                <Typography.Text type="secondary">
                  Subtotal {formatCurrency(purchase.subtotal)}
                </Typography.Text>
                <Typography.Text type="secondary">
                  Discount − {formatCurrency(purchase.discountAmount)}
                </Typography.Text>
              </>
            )}
            <Typography.Text strong style={{ fontSize: 18 }}>
              Total {formatCurrency(purchase.total)}
            </Typography.Text>
          </Flex>
        </>
      )}
    </Modal>
  );
};
