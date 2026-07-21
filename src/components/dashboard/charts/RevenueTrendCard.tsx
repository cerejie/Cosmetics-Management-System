import { Card, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { useSalesMetrics } from '@/hooks/sales/useSalesMetrics';
import { formatCurrency } from '@/utils/common/format';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import * as styles from './RevenueTrendCard.css';

export const RevenueTrendCard = (): JSX.Element => {
  const { dailyRevenue, loading } = useSalesMetrics();
  const peak = Math.max(...dailyRevenue.map((point) => point.revenue), 0);
  const total = dailyRevenue.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <Card
      title="Revenue"
      loading={loading}
      variant="outlined"
      style={{ height: '100%' }}
      extra={
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Last 14 days
        </Typography.Text>
      }
    >
      {peak === 0 ? (
        <EmptyState
          title="No purchases in this period"
          description="Revenue for the last 14 days will chart here once purchases are recorded."
        />
      ) : (
        <>
          <Typography.Text
            style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', display: 'block' }}
          >
            {formatCurrency(total)}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Total across the period · peak {formatCurrency(peak)}
          </Typography.Text>

          <div className={styles.chart}>
            {dailyRevenue.map((point) => {
              const height = Math.round((point.revenue / peak) * 100);
              const caption = `${dayjs(point.date).format('DD MMM')} · ${formatCurrency(point.revenue)}`;

              return (
                <div key={point.date} className={styles.column}>
                  <Tooltip title={caption}>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.bar} ${point.revenue === 0 ? styles.barEmpty : ''}`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                        role="img"
                        aria-label={caption}
                      />
                    </div>
                  </Tooltip>
                  <span className={styles.label}>{dayjs(point.date).format('DD')}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
};
