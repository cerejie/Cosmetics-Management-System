import { Button, Card, Col, Row, Table, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, PrinterOutlined, SwapOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { StatCard } from '@/components/common/cards/StatCard';
import { ReportPeriodFilter } from '@/components/reports/inputs/ReportPeriodFilter';
import { useReportStore } from '@/store/reports/reportStore';
import { useStoreProfileStore } from '@/store/settings/storeProfileStore';
import { useInventoryReport } from '@/hooks/reports/useReport';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { formatNumber } from '@/utils/common/format';
import { printReport } from '@/utils/reports/reportPrint';
import { tablePagination, TABLE_SCROLL } from '@/components/common/tables/tableDefaults';
import type { InventoryFlowRow, InventoryPeriodRow } from '@/utils/reports/reportMetrics';

const signed = (value: number): string => `${value > 0 ? '+' : ''}${formatNumber(value)}`;

const inOut = (value: number, tone: 'success' | 'danger'): JSX.Element =>
  value > 0 ? (
    <Typography.Text type={tone} strong>
      {tone === 'success' ? '+' : '−'}
      {formatNumber(value)}
    </Typography.Text>
  ) : (
    <Typography.Text type="secondary">—</Typography.Text>
  );

const periodColumns: ColumnsType<InventoryPeriodRow> = [
  { title: 'Period', dataIndex: 'label', key: 'label' },
  {
    title: 'Stocks in',
    dataIndex: 'stockIn',
    key: 'stockIn',
    align: 'right',
    render: (value: number) => inOut(value, 'success'),
  },
  {
    title: 'Stocks out',
    dataIndex: 'stockOut',
    key: 'stockOut',
    align: 'right',
    render: (value: number) => inOut(value, 'danger'),
  },
  {
    title: 'Net',
    dataIndex: 'net',
    key: 'net',
    align: 'right',
    render: (value: number) => <Typography.Text strong>{signed(value)}</Typography.Text>,
  },
];

const productColumns: ColumnsType<InventoryFlowRow> = [
  {
    title: 'Product',
    dataIndex: 'productName',
    key: 'productName',
    render: (productName: string) => <Typography.Text strong>{productName}</Typography.Text>,
  },
  {
    title: 'Opening',
    dataIndex: 'opening',
    key: 'opening',
    align: 'right',
    responsive: ['md'],
    render: (value: number) => formatNumber(value),
  },
  {
    title: 'Stocks in',
    dataIndex: 'stockIn',
    key: 'stockIn',
    align: 'right',
    sorter: (a, b) => a.stockIn - b.stockIn,
    render: (value: number) => inOut(value, 'success'),
  },
  {
    title: 'Stocks out',
    dataIndex: 'stockOut',
    key: 'stockOut',
    align: 'right',
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.stockOut - b.stockOut,
    render: (value: number) => inOut(value, 'danger'),
  },
  {
    title: 'Net',
    dataIndex: 'net',
    key: 'net',
    align: 'right',
    render: (value: number) => signed(value),
  },
  {
    title: 'Closing',
    dataIndex: 'closing',
    key: 'closing',
    align: 'right',
    render: (value: number) => <Typography.Text strong>{formatNumber(value)}</Typography.Text>,
  },
];

export const InventoryReportPage = (): JSX.Element => {
  const { summary, byPeriod, byProduct, rangeLabel, loading } = useInventoryReport();
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
        title: 'Inventory Report',
        rangeLabel,
        highlights: [
          { label: 'Stocks in', value: formatNumber(summary.stockIn) },
          { label: 'Stocks out', value: formatNumber(summary.stockOut) },
          { label: 'Net change', value: signed(summary.net) },
          { label: 'Products moved', value: formatNumber(byProduct.length) },
        ],
        sections: [
          {
            heading: 'By period',
            columns: [
              { header: 'Period' },
              { header: 'Stocks in', align: 'right' },
              { header: 'Stocks out', align: 'right' },
              { header: 'Net', align: 'right' },
            ],
            rows: byPeriod.map((row) => [
              row.label,
              formatNumber(row.stockIn),
              formatNumber(row.stockOut),
              signed(row.net),
            ]),
          },
          {
            heading: 'By product',
            columns: [
              { header: 'Product' },
              { header: 'Opening', align: 'right' },
              { header: 'Stocks in', align: 'right' },
              { header: 'Stocks out', align: 'right' },
              { header: 'Net', align: 'right' },
              { header: 'Closing', align: 'right' },
            ],
            rows: byProduct.map((row) => [
              row.productName,
              formatNumber(row.opening),
              formatNumber(row.stockIn),
              formatNumber(row.stockOut),
              signed(row.net),
              formatNumber(row.closing),
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
        title="Inventory report"
        description="Stocks in and stocks out for the period you choose."
        extra={
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print report
          </Button>
        }
      />

      <ReportPeriodFilter />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Stocks in"
            value={formatNumber(summary.stockIn)}
            suffix="items"
            tone="success"
            icon={<ArrowUpOutlined />}
            loading={loading}
            hint="Received from purchases"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Stocks out"
            value={formatNumber(summary.stockOut)}
            suffix="items"
            tone="danger"
            icon={<ArrowDownOutlined />}
            loading={loading}
            hint="Sold or returned to suppliers"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Net change"
            value={signed(summary.net)}
            suffix="items"
            tone={summary.net >= 0 ? 'default' : 'warning'}
            icon={<SwapOutlined />}
            loading={loading}
          />
        </Col>
      </Row>

      <Card variant="outlined" title="By period" style={{ marginBottom: 16 }}>
        <Table<InventoryPeriodRow>
          rowKey="key"
          columns={periodColumns}
          dataSource={byPeriod as InventoryPeriodRow[]}
          loading={loading}
          pagination={tablePagination('periods', 15)}
          scroll={TABLE_SCROLL}
          size="small"
        />
      </Card>

      <Card variant="outlined" title="By product">
        <Table<InventoryFlowRow>
          rowKey="productId"
          columns={productColumns}
          dataSource={byProduct as InventoryFlowRow[]}
          loading={loading}
          pagination={tablePagination('products')}
          scroll={TABLE_SCROLL}
          size="small"
        />
      </Card>
    </>
  );
};
