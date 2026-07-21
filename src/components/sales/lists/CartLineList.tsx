import { Button, Tooltip } from 'antd';
import { CloseOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useCartStore } from '@/store/sales/cartStore';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import { formatCurrency } from '@/utils/common/format';
import * as styles from './CartLineList.css';

/** The cart, as an editable receipt rather than a table. */
export const CartLineList = (): JSX.Element => {
  const lines = useCartStore((state) => state.lines);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeLine = useCartStore((state) => state.removeLine);

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Search the catalogue or scan a barcode to add the first item."
        compact
      />
    );
  }

  return (
    <div className={styles.list}>
      {lines.map((line) => {
        const atStockLimit = line.quantity >= line.availableStock;

        return (
          <div className={styles.line} key={line.productId}>
            <span className={styles.identity}>
              <span className={styles.name}>{line.productName}</span>
              <span className={styles.sku}>SKU: {line.sku}</span>
            </span>

            <span className={styles.stepper}>
              <Button
                type="text"
                size="small"
                icon={<MinusOutlined />}
                disabled={line.quantity <= 1}
                onClick={() => setQuantity(line.productId, line.quantity - 1)}
                aria-label={`Decrease quantity of ${line.productName}`}
              />
              <span className={styles.quantity} aria-live="polite">
                {line.quantity}
              </span>
              <Tooltip title={atStockLimit ? 'No more stock available' : undefined}>
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  disabled={atStockLimit}
                  onClick={() => setQuantity(line.productId, line.quantity + 1)}
                  aria-label={`Increase quantity of ${line.productName}`}
                />
              </Tooltip>
            </span>

            <span className={styles.total}>{formatCurrency(line.unitPrice * line.quantity)}</span>

            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => removeLine(line.productId)}
              aria-label={`Remove ${line.productName} from the cart`}
            />
          </div>
        );
      })}
    </div>
  );
};
