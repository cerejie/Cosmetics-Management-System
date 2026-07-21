import { useMemo } from 'react';
import { Card, Col, List, Row, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import { StatCard } from '@/components/common/cards/StatCard';
import { ReportPeriodFilter } from '@/components/reports/inputs/ReportPeriodFilter';
import { TrendBarsCard } from '@/components/reports/charts/TrendBarsCard';
import { useReportStore } from '@/store/reports/reportStore';
import { useSalesReport } from '@/hooks/reports/useReport';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import { PAYMENT_METHOD_LABELS } from '@/config/constants';
import { tablePagination, TABLE_SCROLL } from '@/components/common/tables/tableDefaults';
import type { ProductSalesRow } from '@/utils/reports/reportMetrics';
import type { PaymentMethod } from '@/types/sales/sales.types';

const RANK_STYLE = {
  display: 'grid',
  placeItems: 'center',
  width: 24,
  height: 24,
  borderRadius: 6,
  background: '#f1f5f9',
  color: '#475569',
  fontSize: 12,
  fontWeight: 600,
} as const;

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
    title: 'Units',
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

export const SalesAnalyticsPage = (): JSX.Element => {
  const { sales, totals, byPeriod, byProduct, bucket, rangeLabel, loading } = useSalesReport();
  const error = useReportStore((state) => state.error);
  const loadReport = useReportStore((state) => state.loadReport);

  useMountEffect(() => {
    void loadReport();
  });

  const trendPoints = useMemo(
    () =>
      byPeriod.map((row) => ({
        key: row.key,
        label: row.label,
        shortLabel: dayjs(row.key).format(bucket === 'month' ? 'MMM' : 'DD'),
        value: row.revenue,
      })),
    [byPeriod, bucket],
  );

  /** Where the money came in — cash, card, GCash or transfer. */
  const paymentMix = useMemo(() => {
    const mix = new Map<PaymentMethod, { count: number; revenue: number }>();

    for (const sale of sales) {
      if (sale.status !== 'completed') continue;
      const existing = mix.get(sale.paymentMethod);
      mix.set(sale.paymentMethod, {
        count: (existing?.count ?? 0) + 1,
        revenue: (existing?.revenue ?? 0) + sale.total,
      });
    }

    return [...mix.entries()]
      .map(([method, figures]) => ({ method, ...figures }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  /** Who spends the most. Walk-in sales are pooled under one entry. */
  const topCustomers = useMemo(() => {
    const spend = new Map<string, { name: string; revenue: number; visits: number }>();

    for (const sale of sales) {
      if (sale.status !== 'completed') continue;

      const name = sale.customerName.trim() || 'Walk-in';
      const existing = spend.get(name);
      spend.set(name, {
        name,
        revenue: (existing?.revenue ?? 0) + sale.total,
        visits: (existing?.visits ?? 0) + 1,
      });
    }

    return [...spend.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [sales]);

  const busiest = useMemo(
    () => [...byPeriod].sort((a, b) => b.revenue - a.revenue)[0] ?? null,
    [byPeriod],
  );

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadReport()} />;
  }

  return (
    <>
      <PageHeader
        title="Sales analytics"
        description="Trends, best sellers and where your revenue comes from."
      />

      <ReportPeriodFilter />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Revenue"
            value={formatCurrency(totals.revenue)}
            loading={loading}
            hint={rangeLabel}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Average sale"
            value={formatCurrency(totals.averageSale)}
            loading={loading}
            hint={`${formatNumber(totals.transactions)} transactions`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Items sold"
            value={formatNumber(totals.itemsSold)}
            loading={loading}
            hint={`${formatNumber(byProduct.length)} different products`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Best period"
            value={busiest && busiest.revenue > 0 ? formatCurrency(busiest.revenue) : '—'}
            loading={loading}
            hint={busiest && busiest.revenue > 0 ? busiest.label : 'No sales yet'}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={16}>
          <TrendBarsCard
            title="Revenue over time"
            subtitle={rangeLabel}
            points={trendPoints}
            loading={loading}
            formatValue={formatCurrency}
            emptyDescription="Revenue will chart here once sales are recorded in this period."
          />
        </Col>

        <Col xs={24} xl={8}>
          <Card title="How customers paid" loading={loading} variant="outlined" style={{ height: '100%' }}>
            <List
              dataSource={paymentMix}
              locale={{
                emptyText: (
                  <EmptyState
                    compact
                    title="No sales yet"
                    description="Payment methods will break down here."
                  />
                ),
              }}
              renderItem={(entry) => {
                const share =
                  totals.revenue > 0 ? Math.round((entry.revenue / totals.revenue) * 100) : 0;

                return (
                  <List.Item key={entry.method}>
                    <List.Item.Meta
                      title={<Tag>{PAYMENT_METHOD_LABELS[entry.method]}</Tag>}
                      description={
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {formatNumber(entry.count)} sales · {share}% of revenue
                        </Typography.Text>
                      }
                    />
                    <Typography.Text strong>{formatCurrency(entry.revenue)}</Typography.Text>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Best sellers" variant="outlined" style={{ height: '100%' }}>
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
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Top customers" loading={loading} variant="outlined" style={{ height: '100%' }}>
            <List
              dataSource={topCustomers}
              locale={{
                emptyText: (
                  <EmptyState
                    compact
                    title="No sales yet"
                    description="Your biggest spenders will rank here."
                  />
                ),
              }}
              renderItem={(customer, index) => (
                <List.Item key={customer.name}>
                  <List.Item.Meta
                    avatar={<span style={RANK_STYLE}>{index + 1}</span>}
                    title={<Typography.Text ellipsis>{customer.name}</Typography.Text>}
                    description={
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {formatNumber(customer.visits)} purchase(s)
                      </Typography.Text>
                    }
                  />
                  <Typography.Text strong>{formatCurrency(customer.revenue)}</Typography.Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};
