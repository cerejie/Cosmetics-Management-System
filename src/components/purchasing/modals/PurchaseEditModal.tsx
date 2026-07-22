import { Button, Flex, Modal, Skeleton, Tabs, Timeline, Typography } from 'antd';
import { usePurchaseStore, type PurchaseEditTab } from '@/store/purchasing/purchaseStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { formatDateTime } from '@/utils/common/format';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import {
  PurchaseDetailsForm,
  PURCHASE_DETAILS_FORM_ID,
} from '@/components/purchasing/forms/PurchaseDetailsForm';
import type { PurchaseChange, PurchaseEdit } from '@/types/purchasing/purchasing.types';
import type { PurchaseDetailsFormValues } from '@/schemas/purchasing/purchase.schema';

const changeLine = (change: PurchaseChange): JSX.Element => (
  <Flex key={change.field} gap={6} wrap="wrap">
    <Typography.Text type="secondary">{change.label}:</Typography.Text>
    <Typography.Text delete type="secondary">
      {change.from}
    </Typography.Text>
    <Typography.Text type="secondary">→</Typography.Text>
    <Typography.Text strong>{change.to}</Typography.Text>
  </Flex>
);

const editEntry = (edit: PurchaseEdit): JSX.Element => (
  <Flex vertical gap={4}>
    <Typography.Text>
      {formatDateTime(edit.changedAt)}
      {' · '}
      <Typography.Text type="secondary">{edit.changedByName ?? 'Unknown user'}</Typography.Text>
    </Typography.Text>
    {edit.changes.map(changeLine)}
  </Flex>
);

/**
 * Correcting a purchase, in two tabs: the paperwork on one, and every change
 * ever made to it on the other. The log is what makes the edit acceptable —
 * a record that can be quietly altered is not a record.
 */
export const PurchaseEditModal = (): JSX.Element => {
  const purchase = usePurchaseStore((state) => state.editPurchase);
  const tab = usePurchaseStore((state) => state.editTab);
  const edits = usePurchaseStore((state) => state.edits);
  const editsLoading = usePurchaseStore((state) => state.editsLoading);
  const saving = usePurchaseStore((state) => state.savingDetails);
  const setTab = usePurchaseStore((state) => state.setEditTab);
  const close = usePurchaseStore((state) => state.closeEdit);
  const updateDetails = usePurchaseStore((state) => state.updatePurchaseDetails);
  const runAction = useAsyncAction();

  const handleSubmit = (values: PurchaseDetailsFormValues): void => {
    void runAction(() => updateDetails(values), 'Purchase updated.');
  };

  const log = editsLoading ? (
    <Skeleton active paragraph={{ rows: 4 }} />
  ) : edits.length === 0 ? (
    <EmptyState
      title="No changes yet"
      description="Every correction made to this purchase will be listed here, with who made it and when."
    />
  ) : (
    <Timeline
      items={edits.map((edit) => ({ key: edit.id, children: editEntry(edit) }))}
      style={{ marginTop: 8 }}
    />
  );

  return (
    <Modal
      title={purchase ? `Update purchase ${purchase.reference}` : 'Update purchase'}
      open={purchase !== null}
      onCancel={close}
      width={720}
      destroyOnHidden
      footer={
        <Flex justify="end" gap={8}>
          <Button size="large" onClick={close} disabled={saving}>
            Close
          </Button>
          {tab === 'details' && (
            <Button
              size="large"
              type="primary"
              htmlType="submit"
              form={PURCHASE_DETAILS_FORM_ID}
              loading={saving}
            >
              Save changes
            </Button>
          )}
        </Flex>
      }
    >
      {purchase && (
        <Tabs
          activeKey={tab}
          onChange={(key) => setTab(key as PurchaseEditTab)}
          items={[
            {
              key: 'details',
              label: 'Purchase details',
              children: <PurchaseDetailsForm purchase={purchase} onSubmit={handleSubmit} />,
            },
            {
              key: 'log',
              label: `Update log${edits.length > 0 ? ` (${edits.length})` : ''}`,
              children: log,
            },
          ]}
        />
      )}
    </Modal>
  );
};
