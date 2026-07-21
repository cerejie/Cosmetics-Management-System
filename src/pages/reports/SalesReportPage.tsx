import { Button, Card, Col, Row, Table, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { StatCard } from '@/components/common/cards/StatCard';
import { ReportPeriodFilter } from '@/components/reports/inputs/ReportPeriodFilter';
import { useReportStore } from '@/store/reports/reportStore';
import { useStoreProfileStore } from '@/store/settings/storeProfileStore';
import { useSalesReport } from '@/hooks/reports/useReport';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import { printReport } from '@/utils/reports/reportPrint';
import { tablePagination, TABLE_SCROLL } from '@/components/common/tables/tableDefaults';
import type { ProductSalesRow, SalesPeriodRow } from '@/utils/reports/reportMetrics';

const periodColumns: ColumnsType<SalesPeriodRow> = [
  { title: 'Period', dataIndex: 'label', key: 'label' },
  {
    title: 'Transactions',
    dataIndex: 'transactions',
    key: 'transactions',
    align: 'right',
    render: (value: number) => formatNumber(value),
  },
  {
    title: 'Items sold',
    dataIndex: 'itemsSold',
    key: 'itemsSold',
    align: 'right',
    render: (value: number) => formatNumber(value),
  },
  {
    title: 'Discounts',
    dataIndex: 'discounts',
    key: 'discounts',
    align: 'right',
    render: (value: number) => formatCurrency(value),
  },
  {
    title: 'Revenue',
    dataIndex: 'revenue',
    key: 'revenue',
    align: 'right',
    render: (value: number) => <Typography.Text strong>{formatCurrency(value)}</Typography.Text>,
  },
];

const productColumns: ColumnsType<ProductSalesRow> = [
  {
    title: 'Product',
    dataIndex: 'productName',
    key: 'productName',
    render: (productName: string, row) => (
      <>
        <Typography.Text>{productName}</Typography.Text>
        <br />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {row.sku}
        </Typography.Text>
      </>
    ),
  },
  {
    title: 'Quantity',
    dataIndex: 'quantity',
    key: 'quantity',
    align: 'right',
    sorter: (a, b) => a.quantity - b.quantity,
    render: (value: number) => formatNumber(value),
  },
  {
    title: 'Revenue',
    dataIndex: 'revenue',
    key: 'revenue',
    align: 'right',
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.revenue - b.revenue,
    render: (value: number) => <Typography.Text strong>{formatCurrency(value)}</Typography.Text>,
  },
];

export const SalesReportPage = (): JSX.Element => {
  const { totals, byPeriod, byProduct, rangeLabel, loading } = useSalesReport();
  const error = useReportStore((state) => state.error);
  const loadReport = useReportStore((state) => state.loadReport);
  const profile = useStoreProfileStore((state) => state.profile);
  const ensureProfile = useStoreProfileStore((state) => state.ensureProfile);

  useMountEffect(() => {
    void loadReport();
    void ensureProfile();
  });

  const handlePrint = (): void => {
    printReport(
      {
        title: 'Sales Report',
        rangeLabel,
        highlights: [
          { label: 'Revenue', value: formatCurrency(totals.revenue) },
          { label: 'Transactions', value: formatNumber(totals.transactions) },
          { label: 'Items sold', value: formatNumber(totals.itemsSold) },
          { label: 'Average sale', value: formatCurrency(totals.averageSale) },
          { label: 'Discounts given', value: formatCurrency(totals.discounts) },
          { label: 'Voided', value: formatNumber(totals.voided) },
        ],
        sections: [
          {
            heading: 'By period',
            columns: [
              { header: 'Period' },
              { header: 'Transactions', align: 'right' },
              { header: 'Items sold', align: 'right' },
              { header: 'Discounts', align: 'right' },
              { header: 'Revenue', align: 'right' },
            ],
            rows: byPeriod.map((row) => [
              row.label,
              formatNumber(row.transactions),
              formatNumber(row.itemsSold),
              formatCurrency(row.discounts),
              formatCurrency(row.revenue),
            ]),
          },
          {
            heading: 'By product',
            columns: [
              { header: 'Product' },
              { header: 'SKU' },
              { header: 'Quantity', align: 'right' },
              { header: 'Revenue', align: 'right' },
            ],
            rows: byProduct.map((row) => [
              row.productName,
              row.sku,
              formatNumber(row.quantity),
              formatCurrency(row.revenue),
            ]),
          },
        ],
      },
      profile,
    );
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadReport()} />;
  }

  return (
    <>
      <PageHeader
        title="Sales report"
        description="Revenue and volume for the period you choose."
        extra={
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print report
          </Button>
        }
      />

      <ReportPeriodFilter />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Revenue"
            value={formatCurrency(totals.revenue)}
            loading={loading}
            hint={`${formatCurrency(totals.discounts)} discounted`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Transactions"
            value={formatNumber(totals.transactions)}
            loading={loading}
            hint={totals.voided > 0 ? `${formatNumber(totals.voided)} voided` : 'None voided'}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Items sold" value={formatNumber(totals.itemsSold)} loading={loading} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Average sale"
            value={formatCurrency(totals.averageSale)}
            loading={loading}
          />
        </Col>
      </Row>

      <Card variant="outlined" title="By period" style={{ marginBottom: 16 }}>
        <Table<SalesPeriodRow>
          rowKey="key"
          columns={periodColumns}
          dataSource={byPeriod as SalesPeriodRow[]}
          loading={loading}
          pagination={tablePagination('periods', 15)}
          scroll={TABLE_SCROLL}
          size="small"
        />
      </Card>

      <Card variant="outlined" title="By product">
        <Table<ProductSalesRow>
          rowKey="productId"
          columns={productColumns}
          dataSource={byProduct as ProductSalesRow[]}
          loading={loading}
          pagination={tablePagination('products')}
          scroll={TABLE_SCROLL}
          size="small"
        />
      </Card>
    </>
  );
};
