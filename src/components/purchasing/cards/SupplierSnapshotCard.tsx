import { Alert, Card, Flex, Typography } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { formatDate } from '@/utils/common/format';
import type { Purchase, Supplier } from '@/types/purchasing/purchasing.types';
import * as styles from './SupplierSnapshotCard.css';

interface SupplierSnapshotCardProps {
  readonly supplier: Supplier;
  readonly purchases: readonly Purchase[];
}

const Fact = ({ label, value }: { readonly label: string; readonly value: string }): JSX.Element => (
  <Flex vertical gap={2}>
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
      {label}
    </Typography.Text>
    <Typography.Text strong style={{ fontSize: 13 }}>
      {value}
    </Typography.Text>
  </Flex>
);

/**
 * What the person recording a delivery wants to know about the supplier they
 * just picked, without leaving the screen. Everything here is derived from data
 * already loaded — there is no accounts-payable ledger, so no balance is shown
 * rather than a number nobody could stand behind.
 */
export const SupplierSnapshotCard = ({
  supplier,
  purchases,
}: SupplierSnapshotCardProps): JSX.Element => {
  const lastPurchase = purchases
    .filter((purchase) => purchase.supplierId === supplier.id)
    .reduce<Purchase | null>(
      (latest, purchase) =>
        latest === null || purchase.purchaseDate > latest.purchaseDate ? purchase : latest,
      null,
    );

  return (
    <Card variant="outlined" size="small" className={styles.card}>
      <Flex align="center" gap={10} style={{ marginBottom: 12 }}>
        <span className={styles.avatar} aria-hidden>
          <ShopOutlined />
        </span>
        <Typography.Text strong style={{ fontSize: 15 }}>
          {supplier.name}
        </Typography.Text>
      </Flex>

      <div className={styles.facts}>
        <Fact
          label="Last purchase"
          value={lastPurchase ? formatDate(lastPurchase.purchaseDate) : 'First delivery'}
        />
        <Fact label="Payment terms" value={supplier.paymentTerms || 'Not set'} />
        <Fact label="Phone" value={supplier.phone || 'Not set'} />
      </div>

      {!supplier.tin && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
          message="No TIN on file"
          description="Add it on the Suppliers tab so it prints on the purchase invoice."
        />
      )}
    </Card>
  );
};
