import { Card, Tooltip, Typography } from 'antd';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import * as styles from './TrendBarsCard.css';

export interface TrendPoint {
  readonly key: string;
  /** Full label, shown on hover. */
  readonly label: string;
  /** Short label under the bar. */
  readonly shortLabel: string;
  readonly value: number;
}

interface TrendBarsCardProps {
  readonly title: string;
  readonly subtitle: string;
  readonly points: readonly TrendPoint[];
  readonly loading: boolean;
  readonly formatValue: (value: number) => string;
  readonly emptyDescription: string;
}

/**
 * A plain CSS bar chart. Reading a shape over time does not justify a charting
 * library in the bundle, and this one inherits the app's theme for free.
 */
export const TrendBarsCard = ({
  title,
  subtitle,
  points,
  loading,
  formatValue,
  emptyDescription,
}: TrendBarsCardProps): JSX.Element => {
  const peak = Math.max(...points.map((point) => point.value), 0);
  const total = points.reduce((sum, point) => sum + point.value, 0);

  return (
    <Card
      title={title}
      loading={loading}
      variant="outlined"
      style={{ height: '100%' }}
      extra={
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {subtitle}
        </Typography.Text>
      }
    >
      {peak === 0 ? (
        <EmptyState title="Nothing in this period" description={emptyDescription} />
      ) : (
        <>
          <Typography.Text
            style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', display: 'block' }}
          >
            {formatValue(total)}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Total across the period · peak {formatValue(peak)}
          </Typography.Text>

          <div className={styles.chart}>
            {points.map((point) => {
              const height = Math.round((point.value / peak) * 100);
              const caption = `${point.label} · ${formatValue(point.value)}`;

              return (
                <div key={point.key} className={styles.column}>
                  <Tooltip title={caption}>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.bar} ${point.value === 0 ? styles.barEmpty : ''}`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                        role="img"
                        aria-label={caption}
                      />
                    </div>
                  </Tooltip>
                  <span className={styles.label}>{point.shortLabel}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
};
