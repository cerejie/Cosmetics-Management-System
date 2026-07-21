import { Col, Row } from 'antd';
import {
  AlertOutlined,
  DollarOutlined,
  InboxOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { StatCard } from '@/components/common/cards/StatCard';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import type { SuggestionSummary } from '@/utils/purchasing/orderSuggestions';

interface SuggestionSummaryCardsProps {
  readonly summary: SuggestionSummary;
  readonly loading: boolean;
}

export const SuggestionSummaryCards = ({
  summary,
  loading,
}: SuggestionSummaryCardsProps): JSX.Element => (
  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
    <Col xs={24} sm={12} xl={6}>
      <StatCard
        title="Products to Restock"
        value={formatNumber(summary.productsToRestock)}
        icon={<InboxOutlined />}
        loading={loading}
        hint="Below their target cover"
      />
    </Col>
    <Col xs={24} sm={12} xl={6}>
      <StatCard
        title="Estimated Purchase Cost"
        value={formatCurrency(summary.estimatedCost)}
        icon={<DollarOutlined />}
        loading={loading}
        hint="At the last cost paid"
      />
    </Col>
    <Col xs={24} sm={12} xl={6}>
      <StatCard
        title="Suppliers Involved"
        value={formatNumber(summary.suppliersInvolved)}
        icon={<TeamOutlined />}
        loading={loading}
        hint="Orders would be split this way"
      />
    </Col>
    <Col xs={24} sm={12} xl={6}>
      <StatCard
        title="Critical Stockouts"
        value={formatNumber(summary.criticalStockouts)}
        icon={<AlertOutlined />}
        tone={summary.criticalStockouts > 0 ? 'danger' : 'success'}
        loading={loading}
        hint="Out of stock within the lead time"
      />
    </Col>
  </Row>
);
