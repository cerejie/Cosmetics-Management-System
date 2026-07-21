import { Flex, Typography } from 'antd';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly extra?: ReactNode;
}

export const PageHeader = ({ title, description, extra }: PageHeaderProps): JSX.Element => (
  <Flex justify="space-between" align="center" gap={16} wrap style={{ marginBottom: 24 }}>
    <Flex vertical gap={4} style={{ minWidth: 0 }}>
      <Typography.Title
        level={2}
        style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}
      >
        {title}
      </Typography.Title>
      {description && (
        <Typography.Text type="secondary" style={{ fontSize: 14 }}>
          {description}
        </Typography.Text>
      )}
    </Flex>
    {extra && (
      <Flex gap={8} align="center" wrap>
        {extra}
      </Flex>
    )}
  </Flex>
);
