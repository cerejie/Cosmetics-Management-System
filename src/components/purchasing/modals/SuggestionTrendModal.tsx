import { Descriptions, Flex, Modal, Progress, Tag, Typography } from 'antd';
import { useSuggestionStore } from '@/store/purchasing/suggestionStore';
import { formatCurrency, formatNumber } from '@/utils/common/format';

/**
 * The reasoning behind a single recommendation. Every number here is one of the
 * inputs the forecast used, so a buyer can agree or overrule it knowingly.
 */
export const SuggestionTrendModal = (): JSX.Element => {
  const productId = useSuggestionStore((state) => state.trendProductId);
  const suggestions = useSuggestionStore((state) => state.suggestions);
  const closeTrend = useSuggestionStore((state) => state.closeTrend);

  const suggestion = suggestions.find((item) => item.productId === productId) ?? null;

  return (
    <Modal
      title={suggestion ? `Why reorder ${suggestion.productName}?` : 'Trend'}
      open={suggestion !== null}
      onCancel={closeTrend}
      footer={null}
      width={600}
      destroyOnHidden
    >
      {suggestion && (
        <>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Current stock">
              {formatNumber(suggestion.currentStock)}
            </Descriptions.Item>
            <Descriptions.Item label="Reorder level">
              {formatNumber(suggestion.reorderLevel)}
            </Descriptions.Item>
            <Descriptions.Item label="Average daily sales">
              {suggestion.averageDailySales.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Days remaining">
              {suggestion.daysRemaining === null
                ? '—'
                : formatNumber(Math.round(suggestion.daysRemaining))}
            </Descriptions.Item>
            <Descriptions.Item label="Sales trend">
              {suggestion.trendPercent === null ? (
                '—'
              ) : (
                <Tag color={suggestion.trendPercent >= 0 ? 'success' : 'warning'}>
                  {suggestion.trendPercent >= 0 ? '+' : ''}
                  {Math.round(suggestion.trendPercent)}%
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Lead time">
              {suggestion.leadTimeDays} days
            </Descriptions.Item>
            <Descriptions.Item label="Supplier">
              {suggestion.supplierName ?? 'No purchase history'}
            </Descriptions.Item>
            <Descriptions.Item label="Estimated cost">
              {formatCurrency(suggestion.estimatedCost)}
            </Descriptions.Item>
          </Descriptions>

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Confidence
          </Typography.Text>
          <Progress percent={suggestion.confidence} style={{ marginBottom: 16 }} />

          <Flex vertical gap={8}>
            {suggestion.insights.map((insight) => (
              <Flex key={insight} gap={8} align="start">
                <span aria-hidden style={{ color: '#c2185b', lineHeight: '22px' }}>
                  •
                </span>
                <Typography.Text>{insight}</Typography.Text>
              </Flex>
            ))}
          </Flex>
        </>
      )}
    </Modal>
  );
};
