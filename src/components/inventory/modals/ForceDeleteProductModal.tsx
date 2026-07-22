import { Alert, Button, Flex, Input, Modal, Skeleton, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import {
  FORCE_DELETE_PHRASE,
  useProductStore,
} from '@/store/inventory/productStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { formatNumber } from '@/utils/common/format';
import { hasHistory, type ProductHistorySummary } from '@/types/inventory/inventory.types';

/** Only the counts that are not zero, phrased as the owner would say them. */
const damageLines = (history: ProductHistorySummary): readonly string[] => {
  const lines: string[] = [];

  if (history.saleItems > 0) {
    lines.push(`${formatNumber(history.saleItems)} line(s) on past sales`);
  }
  if (history.purchaseItems > 0) {
    lines.push(`${formatNumber(history.purchaseItems)} line(s) on past purchases`);
  }
  if (history.purchaseReturns > 0) {
    lines.push(`${formatNumber(history.purchaseReturns)} return(s) to suppliers`);
  }
  if (history.stockMovements > 0) {
    lines.push(`${formatNumber(history.stockMovements)} stock movement(s)`);
  }
  if (history.stockQuantity > 0) {
    lines.push(`${formatNumber(history.stockQuantity)} unit(s) still on hand`);
  }

  return lines;
};

/**
 * The deliberate, irreversible removal. The ordinary Delete button archives a
 * product that has history; this one erases it along with every record it
 * appears in, so it asks for the word to be typed rather than for a click.
 */
export const ForceDeleteProductModal = (): JSX.Element => {
  const product = useProductStore((state) => state.forceDeleteTarget);
  const history = useProductStore((state) => state.forceDeleteHistory);
  const loadingHistory = useProductStore((state) => state.forceDeleteLoadingHistory);
  const confirmation = useProductStore((state) => state.forceDeleteConfirmation);
  const deleting = useProductStore((state) => state.forceDeleting);
  const setConfirmation = useProductStore((state) => state.setForceDeleteConfirmation);
  const close = useProductStore((state) => state.closeForceDelete);
  const forceDelete = useProductStore((state) => state.forceDeleteProduct);
  const runAction = useAsyncAction();

  const confirmed = confirmation.trim().toLowerCase() === FORCE_DELETE_PHRASE;
  const lines = history ? damageLines(history) : [];

  const handleDelete = (): void => {
    if (!product) return;
    void runAction(forceDelete, `${product.name} and all of its records were deleted.`);
  };

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          <WarningOutlined style={{ color: 'var(--ant-color-error, #ff4d4f)' }} />
          <span>Delete permanently</span>
        </Flex>
      }
      open={product !== null}
      onCancel={close}
      destroyOnHidden
      width={560}
      footer={
        <Flex justify="end" gap={8}>
          <Button size="large" onClick={close} disabled={deleting}>
            Cancel
          </Button>
          <Button
            size="large"
            type="primary"
            danger
            loading={deleting}
            disabled={!confirmed || loadingHistory}
            onClick={handleDelete}
          >
            Delete permanently
          </Button>
        </Flex>
      }
    >
      {product && (
        <Flex vertical gap={16}>
          <Typography.Text>
            <Typography.Text strong>{product.name}</Typography.Text>{' '}
            <Typography.Text type="secondary">({product.sku})</Typography.Text> will be removed
            from the system entirely, not marked inactive.
          </Typography.Text>

          {loadingHistory ? (
            <Skeleton active paragraph={{ rows: 3 }} title={false} />
          ) : history && hasHistory(history) ? (
            <Alert
              type="error"
              showIcon
              message="This will also erase its history"
              description={
                <Flex vertical gap={8}>
                  <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                    {lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    Past sales and purchases will no longer list this product, and reports
                    covering those periods will change. A sale or purchase left with nothing on
                    it is removed. This cannot be undone.
                  </Typography.Text>
                </Flex>
              }
            />
          ) : (
            <Alert
              type="info"
              showIcon
              message="This product has no history, so nothing else is affected."
            />
          )}

          <Flex vertical gap={6}>
            <Typography.Text>
              Type <Typography.Text strong>{FORCE_DELETE_PHRASE}</Typography.Text> to continue.
            </Typography.Text>
            <Input
              size="large"
              value={confirmation}
              autoComplete="off"
              placeholder={FORCE_DELETE_PHRASE}
              status={confirmation.length > 0 && !confirmed ? 'error' : undefined}
              onChange={(event) => setConfirmation(event.target.value)}
              onPressEnter={() => confirmed && !loadingHistory && handleDelete()}
              aria-label={`Type ${FORCE_DELETE_PHRASE} to delete ${product.name}`}
            />
          </Flex>
        </Flex>
      )}
    </Modal>
  );
};
