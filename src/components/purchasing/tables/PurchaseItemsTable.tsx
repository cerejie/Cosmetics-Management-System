import { useMemo } from 'react';
import { Button, Divider, Flex, InputNumber, Select, Table, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useProductStore } from '@/store/inventory/productStore';
import { DiscountInput } from '@/components/purchasing/inputs/DiscountInput';
import { getLineDiscount, getLineTotal } from '@/utils/purchasing/purchaseTotals';
import { formatCurrency } from '@/utils/common/format';
import { TABLE_SCROLL } from '@/components/common/tables/tableDefaults';
import type { PurchaseDraftLine } from '@/types/purchasing/purchasing.types';

export const PurchaseItemsTable = (): JSX.Element => {
  const lines = usePurchaseStore((state) => state.draftLines);
  const updateLine = usePurchaseStore((state) => state.updateLine);
  const removeLine = usePurchaseStore((state) => state.removeLine);
  const openNewProduct = usePurchaseStore((state) => state.openNewProduct);
  const products = useProductStore((state) => state.products);

  const productOptions = useMemo(
    () =>
      products
        .filter((product) => product.isActive)
        .map((product) => ({
          label: `${product.name}${product.sku ? ` (${product.sku})` : ''}`,
          value: product.id,
        })),
    [products],
  );

  const columns: ColumnsType<PurchaseDraftLine> = [
    {
      title: 'Product',
      key: 'product',
      width: 300,
      render: (_, line) => (
        <Select
          size="large"
          showSearch
          optionFilterProp="label"
          placeholder="Search by name or SKU"
          style={{ width: '100%' }}
          value={line.productId}
          options={productOptions}
          onChange={(productId: string) => {
            const product = products.find((candidate) => candidate.id === productId);
            // Prefill the cost from the catalogue so the usual case is one tap.
            updateLine(line.key, { productId, unitCost: product?.costPrice ?? line.unitCost });
          }}
          // A delivery can contain something not on file yet, so the picker
          // itself is the place to add it.
          popupRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <Button
                type="link"
                icon={<PlusOutlined />}
                block
                style={{ textAlign: 'left' }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => openNewProduct(line.key)}
              >
                Add a new product
              </Button>
            </>
          )}
        />
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 120,
      render: (_, line) => (
        <InputNumber
          size="large"
          min={1}
          precision={0}
          style={{ width: '100%' }}
          value={line.quantity}
          onChange={(quantity) => updateLine(line.key, { quantity: quantity ?? 1 })}
          aria-label="Quantity"
        />
      ),
    },
    {
      title: 'Cost each',
      key: 'unitCost',
      width: 140,
      render: (_, line) => (
        <InputNumber
          size="large"
          min={0}
          precision={2}
          prefix="₱"
          style={{ width: '100%' }}
          value={line.unitCost}
          onChange={(unitCost) => updateLine(line.key, { unitCost: unitCost ?? 0 })}
          aria-label="Cost each"
        />
      ),
    },
    {
      title: 'Discount',
      key: 'discount',
      width: 170,
      render: (_, line) => (
        <DiscountInput
          size="large"
          type={line.discountType}
          value={line.discountValue}
          onChange={({ type, value }) =>
            updateLine(line.key, { discountType: type, discountValue: value })
          }
          label="Line discount"
        />
      ),
    },
    {
      title: 'Total',
      key: 'lineTotal',
      align: 'right',
      width: 140,
      render: (_, line) => {
        const discount = getLineDiscount(line);

        return (
          <Flex vertical align="end">
            <Typography.Text strong style={{ fontSize: 15 }}>
              {formatCurrency(getLineTotal(line))}
            </Typography.Text>
            {discount > 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                less {formatCurrency(discount)}
              </Typography.Text>
            )}
          </Flex>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 60,
      render: (_, line) => (
        <Button
          type="text"
          danger
          size="large"
          icon={<DeleteOutlined />}
          onClick={() => removeLine(line.key)}
          aria-label="Remove this row"
        />
      ),
    },
  ];

  return (
    <Flex vertical gap={12}>
      <Table<PurchaseDraftLine>
        rowKey="key"
        columns={columns}
        dataSource={lines as PurchaseDraftLine[]}
        pagination={false}
        scroll={TABLE_SCROLL}
      />
    </Flex>
  );
};
