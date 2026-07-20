import { Flex, Typography } from 'antd';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly extra?: ReactNode;
}

export const PageHeader = ({ title, description, extra }: PageHeaderProps): JSX.Element => (
  <Flex justify="space-between" align="flex-start" gap="middle" wrap style={{ marginBottom: 24 }}>
    <Flex vertical gap={4}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      {description && <Typography.Text type="secondary">{description}</Typography.Text>}
    </Flex>
    {extra}
  </Flex>
);
