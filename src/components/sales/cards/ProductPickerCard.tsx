import { useMemo } from 'react';
import { Card, Empty, Flex, Input, List, Button, Tag, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useProductStore } from '@/store/inventory/productStore';
import { useCartStore } from '@/store/sales/cartStore';
import { filterProducts } from '@/utils/inventory/productFilters';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import type { Product } from '@/types/inventory/inventory.types';

export const ProductPickerCard = (): JSX.Element => {
  const products = useProductStore((state) => state.products);
  const status = useProductStore((state) => state.status);
  const search = useCartStore((state) => state.pickerSearch);
  const setSearch = useCartStore((state) => state.setPickerSearch);
  const addProduct = useCartStore((state) => state.addProduct);
  const lines = useCartStore((state) => state.lines);

  // Only sellable products belong in the picker.
  const sellable = useMemo(
    () =>
      filterProducts(products, { search, categoryId: null, lowStockOnly: false }).filter(
        (product) => product.isActive && product.stockQuantity > 0,
      ),
    [products, search],
  );

  const quantityInCart = (product: Product): number =>
    lines.find((line) => line.productId === product.id)?.quantity ?? 0;

  return (
    <Card title="Products" variant="outlined">
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Search by name, SKU or brand"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ marginBottom: 16 }}
      />

      <List
        loading={status === 'loading'}
        dataSource={sellable as Product[]}
        locale={{
          emptyText: <Empty description="No sellable products match your search" />,
        }}
        pagination={sellable.length > 8 ? { pageSize: 8, size: 'small' } : false}
        renderItem={(product) => {
          const inCart = quantityInCart(product);
          const atLimit = inCart >= product.stockQuantity;

          return (
            <List.Item
              key={product.id}
              actions={[
                <Button
                  key="add"
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  disabled={atLimit}
                  onClick={() => addProduct(product)}
                >
                  Add
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Flex gap="small" align="center" wrap>
                    <Typography.Text strong>{product.name}</Typography.Text>
                    {inCart > 0 && <Tag color="magenta">{inCart} in cart</Tag>}
                  </Flex>
                }
                description={
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {product.sku} · {formatCurrency(product.unitPrice)} ·{' '}
                    {formatNumber(product.stockQuantity)} on hand
                  </Typography.Text>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};
