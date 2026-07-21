import type { CSSProperties, ReactNode } from 'react';
import { Typography } from 'antd';
import {
  BarChartOutlined,
  CloudOutlined,
  InboxOutlined,
  LockOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import * as styles from './AuthLayout.css';

const { Text, Title } = Typography;

interface Highlight {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
}

const FEATURES: readonly Highlight[] = [
  {
    icon: <InboxOutlined />,
    title: 'Inventory Tracking',
    description: 'Monitor stock in real-time',
  },
  {
    icon: <ShoppingCartOutlined />,
    title: 'Purchase Management',
    description: 'Manage suppliers and purchases',
  },
  {
    icon: <BarChartOutlined />,
    title: 'Sales Monitoring',
    description: 'Track sales and performance',
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'AI Order Suggestions',
    description: 'Smart suggestions for reordering',
  },
  {
    icon: <PieChartOutlined />,
    title: 'Reports & Analytics',
    description: 'Insights for better decisions',
  },
];

const BADGES: readonly Highlight[] = [
  {
    icon: <SafetyCertificateOutlined />,
    title: 'Secure Login',
    description: 'Role-based access',
  },
  {
    icon: <LockOutlined />,
    title: 'Encrypted Data',
    description: 'Served over HTTPS',
  },
  {
    icon: <CloudOutlined />,
    title: 'Cloud Hosted',
    description: 'Powered by Supabase',
  },
];

/** Position, size and drift timing for each decorative bubble. */
const ORBS: readonly CSSProperties[] = [
  { top: '11%', right: '17%', width: 44, height: 44, animationDuration: '16s' },
  {
    top: '39%',
    right: '39%',
    width: 20,
    height: 20,
    animationDuration: '21s',
    animationDelay: '-6s',
  },
  {
    bottom: '26%',
    left: '9%',
    width: 14,
    height: 14,
    animationDuration: '25s',
    animationDelay: '-11s',
  },
];

interface AuthLayoutProps {
  /** Sits inside the pink circle above the heading. */
  readonly icon: ReactNode;
  readonly title: string;
  readonly subtitle: string;
  readonly children: ReactNode;
}

export const AuthLayout = ({ icon, title, subtitle, children }: AuthLayoutProps): JSX.Element => (
  <div className={styles.page}>
    <aside className={styles.brand}>
      <span className={styles.brandWaves} aria-hidden />
      {ORBS.map((orbStyle, index) => (
        <span key={index} className={styles.orb} style={orbStyle} aria-hidden />
      ))}

      <div className={styles.brandBody}>
        <div className={styles.logo}>
          <span className={styles.logoMark} aria-hidden>
            <ShoppingOutlined />
          </span>
          <span>
            <Title level={1} className={styles.logoName}>
              Cosmetics MS
            </Title>
            <Text className={styles.accent}>Inventory Management System</Text>
          </span>
        </div>

        <div className={styles.brandIntro}>
          <Title level={2} className={styles.headline}>
            Manage your inventory, purchases and sales{' '}
            <span className={styles.accent}>effortlessly</span>
          </Title>
          <Text type="secondary">
            All-in-one solution for small businesses to track products, manage purchases, monitor
            sales, and grow your business.
          </Text>
          <span className={styles.rule} aria-hidden />
        </div>

        <div className={styles.features}>
          {FEATURES.map((item) => (
            <div key={item.title} className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden>
                {item.icon}
              </span>
              <span>
                <Text strong style={{ display: 'block' }}>
                  {item.title}
                </Text>
                <Text type="secondary">{item.description}</Text>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.brandFooter}>
        <div className={styles.badges}>
          {BADGES.map((item) => (
            <div key={item.title} className={styles.badge}>
              <span className={styles.badgeIcon} aria-hidden>
                {item.icon}
              </span>
              <span>
                <Text strong style={{ display: 'block' }}>
                  {item.title}
                </Text>
                <Text type="secondary">{item.description}</Text>
              </span>
            </div>
          ))}
        </div>
        <Text type="secondary" style={{ textAlign: 'center' }}>
          © {new Date().getFullYear()} Cosmetics MS. All rights reserved.
        </Text>
      </div>
    </aside>

    <main className={styles.formPane}>
      <div className={styles.card}>
        <h1 className={styles.compactBrand}>
          <ShoppingOutlined /> Cosmetics MS
        </h1>

        <div className={styles.cardHeader}>
          <span className={styles.cardBadge} aria-hidden>
            {icon}
          </span>
          <Title level={2} className={styles.cardTitle}>
            {title}
          </Title>
          <Text type="secondary">{subtitle}</Text>
        </div>

        {children}
      </div>
    </main>
  </div>
);
