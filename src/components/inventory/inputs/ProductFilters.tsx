import { Flex, Input, Select, Switch, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';

export const ProductFilters = (): JSX.Element => {
  const search = useProductStore((state) => state.search);
  const setSearch = useProductStore((state) => state.setSearch);
  const categoryFilter = useProductStore((state) => state.categoryFilter);
  const setCategoryFilter = useProductStore((state) => state.setCategoryFilter);
  const lowStockOnly = useProductStore((state) => state.lowStockOnly);
  const setLowStockOnly = useProductStore((state) => state.setLowStockOnly);
  const categories = useCategoryStore((state) => state.categories);

  return (
    <Flex gap="middle" wrap align="center" style={{ marginBottom: 16 }}>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Search by name, SKU or brand"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ maxWidth: 320, flex: '1 1 240px' }}
      />

      <Select
        allowClear
        placeholder="All categories"
        value={categoryFilter}
        onChange={(value) => setCategoryFilter(value ?? null)}
        options={categories.map((category) => ({ label: category.name, value: category.id }))}
        style={{ minWidth: 180 }}
      />

      <Flex gap="small" align="center">
        <Switch checked={lowStockOnly} onChange={setLowStockOnly} id="low-stock-filter" />
        <Typography.Text>
          <label htmlFor="low-stock-filter">Low stock only</label>
        </Typography.Text>
      </Flex>
    </Flex>
  );
};
