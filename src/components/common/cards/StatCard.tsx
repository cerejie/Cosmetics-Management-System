import { Card } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import * as styles from './StatCard.css';

type Tone = 'default' | 'success' | 'warning' | 'danger';
type TrendDirection = 'up' | 'down' | 'flat';

interface StatCardTrend {
  readonly direction: TrendDirection;
  /** Human-readable delta, e.g. "+12.4% vs. last month". */
  readonly label: string;
}

interface StatCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly icon?: ReactNode;
  readonly tone?: Tone;
  readonly loading?: boolean;
  readonly suffix?: string;
  /** Supporting context shown under the value. */
  readonly hint?: string;
  readonly trend?: StatCardTrend;
}

const TREND_ICONS: Readonly<Record<TrendDirection, ReactNode>> = {
  up: <ArrowUpOutlined />,
  down: <ArrowDownOutlined />,
  flat: <MinusOutlined />,
};

export const StatCard = ({
  title,
  value,
  icon,
  tone = 'default',
  loading = false,
  suffix,
  hint,
  trend,
}: StatCardProps): JSX.Element => (
  <Card className={styles.card} loading={loading} variant="outlined" styles={{ body: { padding: 20 } }}>
    <div className={styles.body}>
      <div className={styles.topRow}>
        <p className={styles.title}>{title}</p>
        {icon && (
          <span className={styles.icon[tone]} aria-hidden>
            {icon}
          </span>
        )}
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        {suffix && <span className={styles.suffix}>{suffix}</span>}
        {trend && (
          <span className={`${styles.trendChip} ${styles.trend[trend.direction]}`}>
            {TREND_ICONS[trend.direction]}
            {trend.label}
          </span>
        )}
      </div>

      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  </Card>
);
