import { Button, Col, DatePicker, Form, Input, Row, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';

export const PurchaseFilters = (): JSX.Element => {
  const search = usePurchaseStore((state) => state.search);
  const setSearch = usePurchaseStore((state) => state.setSearch);
  const supplierFilter = usePurchaseStore((state) => state.supplierFilter);
  const setSupplierFilter = usePurchaseStore((state) => state.setSupplierFilter);
  const categoryFilter = usePurchaseStore((state) => state.categoryFilter);
  const setCategoryFilter = usePurchaseStore((state) => state.setCategoryFilter);
  const dateRange = usePurchaseStore((state) => state.dateRange);
  const setDateRange = usePurchaseStore((state) => state.setDateRange);
  const clearFilters = usePurchaseStore((state) => state.clearFilters);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const categories = useCategoryStore((state) => state.categories);

  const hasFilters =
    search !== '' || supplierFilter !== null || categoryFilter !== null || dateRange !== null;

  return (
    <Row gutter={[12, 12]} align="bottom" style={{ marginBottom: 16 }}>
      <Col xs={24} md={12} lg={7}>
        <Form.Item label="Search product or supplier" style={{ marginBottom: 0 }}>
          <Input
            size="large"
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Type a product or supplier name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Form.Item>
      </Col>

      <Col xs={24} md={12} lg={7}>
        <Form.Item label="Date range" style={{ marginBottom: 0 }}>
          <DatePicker.RangePicker
            size="large"
            style={{ width: '100%' }}
            format="DD MMM YYYY"
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(range) =>
              setDateRange(
                range?.[0] && range?.[1]
                  ? [range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD')]
                  : null,
              )
            }
          />
        </Form.Item>
      </Col>

      <Col xs={24} md={12} lg={5}>
        <Form.Item label="Supplier" style={{ marginBottom: 0 }}>
          <Select
            size="large"
            allowClear
            style={{ width: '100%' }}
            placeholder="All suppliers"
            value={supplierFilter}
            onChange={(value: string | undefined) => setSupplierFilter(value ?? null)}
            options={suppliers.map((supplier) => ({ label: supplier.name, value: supplier.id }))}
          />
        </Form.Item>
      </Col>

      <Col xs={24} md={12} lg={5}>
        <Form.Item label="Category" style={{ marginBottom: 0 }}>
          <Select
            size="large"
            allowClear
            style={{ width: '100%' }}
            placeholder="All categories"
            value={categoryFilter}
            onChange={(value: string | undefined) => setCategoryFilter(value ?? null)}
            options={categories.map((category) => ({
              label: category.name,
              value: category.id,
            }))}
          />
        </Form.Item>
      </Col>

      {hasFilters && (
        <Col xs={24}>
          <Button size="large" onClick={clearFilters}>
            Clear filters
          </Button>
        </Col>
      )}
    </Row>
  );
};
