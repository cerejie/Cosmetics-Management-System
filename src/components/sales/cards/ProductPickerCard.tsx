import { useMemo } from 'react';
import {
  Button,
  Card,
  Input,
  Popover,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { ControlOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useCartStore } from '@/store/sales/cartStore';
import { filterProducts, sortProducts, type ProductSort } from '@/utils/inventory/productFilters';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import { TABLE_SCROLL } from '@/components/common/tables/tableDefaults';
import { getStockLevel, type Product } from '@/types/inventory/inventory.types';
import type { SelectOption } from '@/types/common/api.types';
import * as styles from './ProductPickerCard.css';

const SORT_OPTIONS: readonly SelectOption<ProductSort>[] = [
  { label: 'Name A–Z', value: 'name-asc' },
  { label: 'Name Z–A', value: 'name-desc' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Stock: high to low', value: 'stock-desc' },
];

const PAGINATION: TablePaginationConfig = {
  defaultPageSize: 25,
  showSizeChanger: true,
  pageSizeOptions: [25, 50, 100],
  size: 'small',
  hideOnSinglePage: true,
};

/**
 * The fallback cap for the scrolling body. Desktop replaces it with the space
 * left in the card; below `lg` it keeps the page short.
 */
const TABLE_SCROLL_FILL = { ...TABLE_SCROLL, y: 360 } as const;

export const ProductPickerCard = (): JSX.Element => {
  const products = useProductStore((state) => state.products);
  const status = useProductStore((state) => state.status);
  const categories = useCategoryStore((state) => state.categories);

  const search = useCartStore((state) => state.pickerSearch);
  const setSearch = useCartStore((state) => state.setPickerSearch);
  const categoryId = useCartStore((state) => state.pickerCategoryId);
  const setCategoryId = useCartStore((state) => state.setPickerCategoryId);
  const lowStockOnly = useCartStore((state) => state.pickerLowStockOnly);
  const setLowStockOnly = useCartStore((state) => state.setPickerLowStockOnly);
  const sort = useCartStore((state) => state.pickerSort);
  const setSort = useCartStore((state) => state.setPickerSort);
  const resetFilters = useCartStore((state) => state.resetPickerFilters);
  const addProduct = useCartStore((state) => state.addProduct);
  const lines = useCartStore((state) => state.lines);

  // Only sellable products belong in the picker.
  const sellable = useMemo(
    () =>
      sortProducts(
        filterProducts(products, { search, categoryId, lowStockOnly }).filter(
          (product) => product.isActive && product.stockQuantity > 0,
        ),
        sort,
      ),
    [products, search, categoryId, lowStockOnly, sort],
  );

  const quantityInCart = (product: Product): number =>
    lines.find((line) => line.productId === product.id)?.quantity ?? 0;

  const columns: ColumnsType<Product> = [
    {
      title: 'Product name',
      dataIndex: 'name',
      key: 'name',
      render: (_, product) => {
        const inCart = quantityInCart(product);

        return (
          <div className={styles.identity}>
            <Space size="small" wrap>
              <Typography.Text strong>{product.name}</Typography.Text>
              {inCart > 0 && <Tag color="magenta">{inCart} in cart</Tag>}
            </Space>
            <span className={styles.fullMeta}>SKU: {product.sku}</span>
            <span className={styles.compactMeta}>
              {formatCurrency(product.unitPrice)} · {formatNumber(product.stockQuantity)} in stock
            </span>
          </div>
        );
      },
    },
    {
      title: 'Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      width: 110,
      responsive: ['sm'],
      render: (unitPrice: number) => formatCurrency(unitPrice),
    },
    {
      title: 'Stock',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      align: 'right',
      width: 130,
      // Matches the `compactMeta` breakpoint, so stock is never missing.
      responsive: ['sm'],
      render: (_, product) => (
        <Typography.Text type={getStockLevel(product) === 'low_stock' ? 'warning' : 'secondary'}>
          {formatNumber(product.stockQuantity)} in stock
        </Typography.Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: 100,
      render: (_, product) => {
        const atLimit = quantityInCart(product) >= product.stockQuantity;

        return (
          <Tooltip title={atLimit ? 'All available stock is already in the cart' : undefined}>
            <Button
              type="primary"
              ghost
              size="small"
              icon={<PlusOutlined />}
              disabled={atLimit}
              onClick={() => addProduct(product)}
              aria-label={`Add ${product.name} to the cart`}
            >
              Add
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Card
      variant="outlined"
      className={styles.card}
      classNames={{ body: styles.cardBody }}
      styles={{ body: { padding: 16 } }}
    >
      <div className={styles.toolbar}>
        <Input
          allowClear
          className={styles.search}
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Search by name, SKU or brand"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search products"
        />

        <Select<ProductSort>
          value={sort}
          onChange={setSort}
          options={[...SORT_OPTIONS]}
          className={styles.sort}
          aria-label="Sort products"
        />

        <Popover
          trigger="click"
          placement="bottomRight"
          title="Filters"
          content={
            <div className={styles.filterPanel}>
              <div className={styles.filterRow}>
                <Typography.Text>Low stock only</Typography.Text>
                <Switch
                  size="small"
                  checked={lowStockOnly}
                  onChange={setLowStockOnly}
                  aria-label="Show low stock products only"
                />
              </div>
              <Button size="small" onClick={resetFilters} block>
                Reset filters
              </Button>
            </div>
          }
        >
          <Button icon={<ControlOutlined />} aria-label="Filter products" />
        </Popover>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.chips}>
          <Button
            shape="round"
            size="small"
            className={styles.chip}
            type={categoryId === null ? 'primary' : 'default'}
            ghost={categoryId === null}
            onClick={() => setCategoryId(null)}
          >
            All
          </Button>

          {categories.map((category) => (
            <Button
              key={category.id}
              shape="round"
              size="small"
              className={styles.chip}
              type={categoryId === category.id ? 'primary' : 'default'}
              ghost={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        <span className={styles.count}>{sellable.length} products</span>
      </div>

      <div className={styles.tableArea}>
        <Table<Product>
          rowKey="id"
          columns={columns}
          dataSource={sellable as Product[]}
          loading={status === 'loading'}
          pagination={PAGINATION}
          scroll={TABLE_SCROLL_FILL}
          size="small"
          locale={{
            emptyText: (
              <EmptyState
                title="No sellable products match your filters"
                description="Try another search term, or clear the category and stock filters."
                compact
              />
            ),
          }}
        />
      </div>
    </Card>
  );
};
