import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

interface StatCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly icon?: ReactNode;
  readonly tone?: 'default' | 'success' | 'warning' | 'danger';
  readonly loading?: boolean;
  readonly suffix?: string;
}

const TONE_COLORS: Readonly<Record<NonNullable<StatCardProps['tone']>, string | undefined>> = {
  default: undefined,
  success: '#2e7d32',
  warning: '#ed6c02',
  danger: '#c62828',
};

export const StatCard = ({
  title,
  value,
  icon,
  tone = 'default',
  loading = false,
  suffix,
}: StatCardProps): JSX.Element => (
  <Card size="small" loading={loading} variant="outlined">
    <Statistic
      title={title}
      value={value}
      prefix={icon}
      suffix={suffix}
      valueStyle={{ color: TONE_COLORS[tone], fontSize: 24 }}
    />
  </Card>
);
