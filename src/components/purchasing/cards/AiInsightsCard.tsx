import { Card, Flex, Tag, Typography } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

interface AiInsightsCardProps {
  readonly insights: readonly string[];
  readonly loading: boolean;
}

/** What the forecast is built from — stated plainly, so the advice is auditable. */
const SOURCES = ['Sales Trend', 'Current Stock', 'Purchase History'];

export const AiInsightsCard = ({ insights, loading }: AiInsightsCardProps): JSX.Element => (
  <Card
    variant="outlined"
    loading={loading}
    title={
      <Flex align="center" gap={8}>
        <BulbOutlined style={{ color: '#c2185b' }} />
        <span>AI Insights</span>
      </Flex>
    }
    extra={
      <Flex gap={4} wrap>
        {SOURCES.map((source) => (
          <Tag key={source} color="magenta">
            {source}
          </Tag>
        ))}
      </Flex>
    }
    style={{ marginBottom: 16 }}
  >
    {insights.length === 0 ? (
      <Typography.Text type="secondary">
        Generate suggestions to see what the sales trend implies for your next order.
      </Typography.Text>
    ) : (
      <Flex vertical gap={8}>
        {insights.map((insight) => (
          <Flex key={insight} gap={8} align="start">
            <span aria-hidden style={{ color: '#c2185b', lineHeight: '22px' }}>
              •
            </span>
            <Typography.Text>{insight}</Typography.Text>
          </Flex>
        ))}
      </Flex>
    )}
  </Card>
);
