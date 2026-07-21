import { App, Input, Modal, Typography } from 'antd';
import { BarcodeOutlined } from '@ant-design/icons';
import { useProductStore } from '@/store/inventory/productStore';
import { useCartStore } from '@/store/sales/cartStore';

/**
 * Quick add by SKU. A keyboard-wedge barcode scanner types the code and sends
 * Enter, so scanning and typing land in the same place. Products have no
 * dedicated barcode column — the SKU is the scannable identifier.
 */
export const ScanProductModal = (): JSX.Element => {
  const open = useCartStore((state) => state.scanOpen);
  const setScanOpen = useCartStore((state) => state.setScanOpen);
  const addProduct = useCartStore((state) => state.addProduct);
  const products = useProductStore((state) => state.products);
  const { message } = App.useApp();

  const handleScan = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const code = event.currentTarget.value.trim().toLowerCase();
    if (!code) return;

    const match = products.find(
      (product) => product.sku.toLowerCase() === code && product.isActive,
    );

    if (!match) {
      message.error(`No product matches "${code}".`);
      return;
    }

    if (match.stockQuantity <= 0) {
      message.error(`${match.name} is out of stock.`);
      return;
    }

    addProduct(match);
    message.success(`${match.name} added.`);
    // Cleared rather than closed so a run of items can be scanned back to back.
    event.currentTarget.value = '';
  };

  return (
    <Modal
      open={open}
      onCancel={() => setScanOpen(false)}
      title="Scan barcode"
      footer={null}
      destroyOnHidden
      width={420}
    >
      <Typography.Paragraph type="secondary">
        Scan an item or type its SKU, then press Enter. The dialog stays open so you can scan
        several items in a row.
      </Typography.Paragraph>

      <Input
        autoFocus
        size="large"
        prefix={<BarcodeOutlined style={{ color: '#94a3b8' }} />}
        placeholder="Barcode or SKU"
        onPressEnter={handleScan}
        aria-label="Barcode or SKU"
      />
    </Modal>
  );
};
