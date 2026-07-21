import { useMemo } from 'react';
import { Alert, DatePicker, Flex, Form, Modal, Segmented, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useStoreProfileStore } from '@/store/settings/storeProfileStore';
import { printInvoice } from '@/utils/common/invoiceHtml';
import { purchasesForSupplier, toSupplierStatement } from '@/utils/purchasing/purchaseInvoice';
import { formatCurrency, formatDate } from '@/utils/common/format';

const { RangePicker } = DatePicker;

const ISO = 'YYYY-MM-DD';

/**
 * A statement covers a period, so the period is chosen before anything is
 * printed. It opens on the supplier's most relevant one — see
 * `defaultStatementRange` — and a single day is just a range of one.
 */
export const SupplierStatementModal = (): JSX.Element => {
  const supplier = useSupplierStore((state) => state.statementSupplier);
  const range = useSupplierStore((state) => state.statementRange);
  const setRange = useSupplierStore((state) => state.setStatementRange);
  const close = useSupplierStore((state) => state.closeStatement);
  const purchases = usePurchaseStore((state) => state.purchases);
  const profile = useStoreProfileStore((state) => state.profile);

  const isSingleDay = range !== null && range.from === range.to;

  const included = useMemo(() => {
    if (!supplier || !range) return [];
    return purchasesForSupplier(supplier.id, purchases).filter(
      (purchase) => purchase.purchaseDate >= range.from && purchase.purchaseDate <= range.to,
    );
  }, [supplier, range, purchases]);

  const total = included.reduce((sum, purchase) => sum + purchase.total, 0);

  const allForSupplier = useMemo(
    () => (supplier ? purchasesForSupplier(supplier.id, purchases) : []),
    [supplier, purchases],
  );
  const earliest = allForSupplier[0];
  const latest = allForSupplier[allForSupplier.length - 1];

  const handlePrint = (): void => {
    if (!supplier || !range) return;
    printInvoice(toSupplierStatement(supplier, purchases, range, profile));
    close();
  };

  return (
    <Modal
      title={supplier ? `Statement for ${supplier.name}` : 'Statement'}
      open={supplier !== null}
      onCancel={close}
      onOk={handlePrint}
      okText="Print statement"
      okButtonProps={{ icon: <PrinterOutlined />, size: 'large', disabled: range === null }}
      cancelButtonProps={{ size: 'large' }}
      destroyOnHidden
      width={560}
    >
      <Form layout="vertical" size="large" component={false}>
        <Form.Item label="Cover" style={{ marginBottom: 16 }}>
          <Segmented
            options={[
              { label: 'Date range', value: 'range' },
              { label: 'A single day', value: 'day' },
            ]}
            value={isSingleDay ? 'day' : 'range'}
            onChange={(value) => {
              if (!range) return;
              // Switching to a single day keeps the end of the range, which is
              // the day the user was most recently looking at.
              setRange(value === 'day' ? { from: range.to, to: range.to } : range);
            }}
          />
        </Form.Item>

        <Form.Item label={isSingleDay ? 'Date' : 'From and to'} style={{ marginBottom: 16 }}>
          {isSingleDay ? (
            <DatePicker
              style={{ width: '100%' }}
              format="DD MMM YYYY"
              allowClear={false}
              value={range ? dayjs(range.to) : null}
              onChange={(date) => {
                if (date) setRange({ from: date.format(ISO), to: date.format(ISO) });
              }}
            />
          ) : (
            <RangePicker
              style={{ width: '100%' }}
              format="DD MMM YYYY"
              allowClear={false}
              value={range ? [dayjs(range.from), dayjs(range.to)] : null}
              onChange={(dates) => {
                const [from, to] = dates ?? [];
                if (from && to) setRange({ from: from.format(ISO), to: to.format(ISO) });
              }}
            />
          )}
        </Form.Item>
      </Form>

      {included.length > 0 ? (
        <Alert
          type="success"
          showIcon
          message={`${included.length} purchase(s) · ${formatCurrency(total)}`}
          description="These will appear on the statement."
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          message="No purchases in this period"
          description={
            earliest && latest
              ? `This supplier has purchases between ${formatDate(
                  earliest.purchaseDate,
                )} and ${formatDate(latest.purchaseDate)}.`
              : 'Nothing has been bought from this supplier yet.'
          }
        />
      )}

      {supplier && !supplier.tin && (
        <Flex style={{ marginTop: 12 }}>
          <Typography.Text type="secondary">
            This supplier has no TIN on file, so that line will be left off.
          </Typography.Text>
        </Flex>
      )}
    </Modal>
  );
};
