import { Alert, Button, Col, Row } from 'antd';
import { BarcodeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ShortcutHint } from '@/components/common/feedback/ShortcutHint';
import { ProductPickerCard } from '@/components/sales/cards/ProductPickerCard';
import { OrderSummaryCard } from '@/components/sales/cards/OrderSummaryCard';
import { ScanProductModal } from '@/components/sales/modals/ScanProductModal';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useCustomerStore } from '@/store/sales/customerStore';
import { useCartStore } from '@/store/sales/cartStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useHotkey } from '@/hooks/common/useHotkey';
import * as styles from './NewSalePage.css';

export const NewSalePage = (): JSX.Element => {
  const loadProducts = useProductStore((state) => state.loadProducts);
  const loadCategories = useCategoryStore((state) => state.loadCategories);
  const loadCustomers = useCustomerStore((state) => state.loadCustomers);
  const scanOpen = useCartStore((state) => state.scanOpen);
  const setScanOpen = useCartStore((state) => state.setScanOpen);
  const tipDismissed = useCartStore((state) => state.tipDismissed);
  const dismissTip = useCartStore((state) => state.dismissTip);

  useMountEffect(() => {
    void loadProducts();
    void loadCategories();
    // Feeds the customer box: picking one fills in their contact and TIN.
    void loadCustomers();
  });

  useHotkey('F2', () => setScanOpen(true), { enabled: !scanOpen });

  return (
    <div className={styles.page}>
      <PageHeader
        title="New Transaction"
        description="Add items to the cart, then take payment."
        extra={
          <Button icon={<BarcodeOutlined />} onClick={() => setScanOpen(true)}>
            Scan barcode
            <ShortcutHint keyLabel="F2" />
          </Button>
        }
      />

      <Row gutter={[16, 16]} align="stretch" className={styles.columns}>
        <Col xs={24} lg={14} className={styles.column}>
          <ProductPickerCard />
        </Col>

        <Col xs={24} lg={10} className={styles.column}>
          <OrderSummaryCard />
        </Col>
      </Row>

      {!tipDismissed && (
        <Alert
          className={styles.tip}
          type="info"
          icon={<ThunderboltOutlined />}
          showIcon
          message="Press F2 to scan a barcode, F5 to complete the purchase and F3 to clear the cart."
          action={
            <Button size="small" type="text" onClick={dismissTip}>
              Dismiss
            </Button>
          }
        />
      )}

      <ScanProductModal />
    </div>
  );
};
