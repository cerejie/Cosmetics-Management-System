import { Button, Empty, Flex, Typography } from 'antd';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  /** Primary call to action. Omit for purely informational empties. */
  readonly action?: { readonly label: string; readonly onClick: () => void; readonly icon?: ReactNode };
  readonly compact?: boolean;
}

/**
 * The single empty state for lists, tables and cards, so "nothing here yet"
 * always reads the same way and always offers the next step when there is one.
 */
export const EmptyState = ({
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps): JSX.Element => (
  <Empty
    image={Empty.PRESENTED_IMAGE_SIMPLE}
    imageStyle={{ height: compact ? 44 : 64, marginBottom: compact ? 8 : 16 }}
    description={
      <Flex vertical gap={4} align="center" style={{ maxWidth: 360, margin: '0 auto' }}>
        <Typography.Text strong style={{ fontSize: compact ? 14 : 16 }}>
          {title}
        </Typography.Text>
        {description && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {description}
          </Typography.Text>
        )}
      </Flex>
    }
  >
    {action && (
      <Button type="primary" icon={action.icon} onClick={action.onClick} style={{ marginTop: 8 }}>
        {action.label}
      </Button>
    )}
  </Empty>
);
