import { Card, Empty, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useSalesMetrics } from '@/hooks/sales/useSalesMetrics';
import { formatCurrency } from '@/utils/common/format';
import * as styles from './RevenueTrendCard.css';

export const RevenueTrendCard = (): JSX.Element => {
  const { dailyRevenue, loading } = useSalesMetrics();
  const peak = Math.max(...dailyRevenue.map((point) => point.revenue), 0);

  return (
    <Card title="Revenue — last 14 days" loading={loading} variant="outlined">
      {peak === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No sales in this period" />
      ) : (
        <div className={styles.chart}>
          {dailyRevenue.map((point) => (
            <div key={point.date} className={styles.column}>
              <Tooltip
                title={`${dayjs(point.date).format('DD MMM')} · ${formatCurrency(point.revenue)}`}
              >
                <div
                  className={styles.bar}
                  style={{ height: `${Math.round((point.revenue / peak) * 100)}%` }}
                  role="img"
                  aria-label={`${dayjs(point.date).format('DD MMM')}: ${formatCurrency(point.revenue)}`}
                />
              </Tooltip>
              <span className={styles.label}>{dayjs(point.date).format('DD')}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
