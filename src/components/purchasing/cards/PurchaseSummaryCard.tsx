import type { ReactNode } from 'react';
import { Card, Divider, Flex, Space, Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { DiscountInput } from '@/components/purchasing/inputs/DiscountInput';
import { getPurchaseTotals, isCompleteLine } from '@/utils/purchasing/purchaseTotals';
import { formatCurrency, formatNumber } from '@/utils/common/format';
import * as styles from './PurchaseSummaryCard.css';

interface PurchaseSummaryCardProps {
  /** The save controls, so the card stays presentational about submitting. */
  readonly actions: ReactNode;
}

const Row = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): JSX.Element => (
  <div className={styles.row}>
    <Typography.Text type="secondary">{label}</Typography.Text>
    <Typography.Text>{value}</Typography.Text>
  </div>
);

export const PurchaseSummaryCard = ({ actions }: PurchaseSummaryCardProps): JSX.Element => {
  const lines = usePurchaseStore((state) => state.draftLines);
  const header = usePurchaseStore((state) => state.draftHeader);
  const setDraftHeader = usePurchaseStore((state) => state.setDraftHeader);

  // Incomplete rows are placeholders, not zero-cost items, so they are left out
  // of the money entirely rather than counted as products worth nothing.
  const totals = getPurchaseTotals(
    lines.filter(isCompleteLine),
    header.discountType,
    header.discountValue,
  );

  return (
    <Card
      variant="outlined"
      className={styles.card}
      title={
        <Space size="small">
          <FileTextOutlined />
          Purchase summary
        </Space>
      }
    >
      <Flex vertical gap={4}>
        <Row label="Products" value={formatNumber(totals.itemCount)} />
        <Row label="Total items" value={formatNumber(totals.totalQuantity)} />
        <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />

        <div className={styles.discountRow}>
          <Typography.Text type="secondary">Discount</Typography.Text>
          <div className={styles.discountControl}>
            <DiscountInput
              type={header.discountType}
              value={header.discountValue}
              onChange={({ type, value }) =>
                setDraftHeader({ discountType: type, discountValue: value })
              }
              label="Order discount"
            />
          </div>
        </div>

        {totals.discount > 0 && (
          <Row label="Discount applied" value={`− ${formatCurrency(totals.discount)}`} />
        )}
      </Flex>

      <Divider style={{ marginBlock: 12 }} />

      <div className={styles.total}>
        <Typography.Text strong style={{ fontSize: 15 }}>
          Grand total
        </Typography.Text>
        <Typography.Text strong style={{ fontSize: 24, color: '#c2185b' }}>
          {formatCurrency(totals.total)}
        </Typography.Text>
      </div>

      <Flex vertical gap={8} style={{ marginTop: 16 }}>
        {actions}
      </Flex>
    </Card>
  );
};
