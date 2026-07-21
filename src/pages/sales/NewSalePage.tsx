import { Alert, Button, Col, Row } from 'antd';
import { BarcodeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ShortcutHint } from '@/components/common/feedback/ShortcutHint';
import { ProductPickerCard } from '@/components/sales/cards/ProductPickerCard';
import { OrderSummaryCard } from '@/components/sales/cards/OrderSummaryCard';
import { ScanProductModal } from '@/components/sales/modals/ScanProductModal';
import { useProductStore } from '@/store/inventory/productStore';
import { useCategoryStore } from '@/store/inventory/categoryStore';
import { useSalesStore } from '@/store/sales/salesStore';
import { useCartStore } from '@/store/sales/cartStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useHotkey } from '@/hooks/common/useHotkey';
import * as styles from './NewSalePage.css';

export const NewSalePage = (): JSX.Element => {
  const loadProducts = useProductStore((state) => state.loadProducts);
  const loadCategories = useCategoryStore((state) => state.loadCategories);
  const loadSales = useSalesStore((state) => state.loadSales);
  const scanOpen = useCartStore((state) => state.scanOpen);
  const setScanOpen = useCartStore((state) => state.setScanOpen);
  const tipDismissed = useCartStore((state) => state.tipDismissed);
  const dismissTip = useCartStore((state) => state.dismissTip);

  useMountEffect(() => {
    void loadProducts();
    void loadCategories();
    // Past sales only feed the customer-name suggestions.
    void loadSales();
  });

  useHotkey('F2', () => setScanOpen(true), { enabled: !scanOpen });

  return (
    <>
      <PageHeader
        title="New purchase"
        description="Add items to the cart, then take payment."
        extra={
          <Button icon={<BarcodeOutlined />} onClick={() => setScanOpen(true)}>
            Scan barcode
            <ShortcutHint keyLabel="F2" />
          </Button>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <ProductPickerCard />
        </Col>

        <Col xs={24} lg={10}>
          <div className={styles.summaryColumn}>
            <OrderSummaryCard />
          </div>
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
    </>
  );
};
