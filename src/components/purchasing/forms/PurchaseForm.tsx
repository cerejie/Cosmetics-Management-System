import { useMemo } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Tooltip,
  Typography,
} from 'antd';
import { CheckCircleOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { purchaseSchema, purchaseFields } from '@/schemas/purchasing/purchase.schema';
import { zodRules } from '@/utils/common/formRules';
import { getPurchaseTotals, isCompleteLine } from '@/utils/purchasing/purchaseTotals';
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/common/format';
import { PurchaseItemsTable } from '@/components/purchasing/tables/PurchaseItemsTable';
import { PurchaseSummaryCard } from '@/components/purchasing/cards/PurchaseSummaryCard';
import { SupplierSnapshotCard } from '@/components/purchasing/cards/SupplierSnapshotCard';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TERMS_OPTIONS,
} from '@/types/purchasing/purchasing.types';
import * as styles from './PurchaseForm.css';

const rules = zodRules(purchaseFields.shape);

const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map((method) => ({
  label: PAYMENT_METHOD_LABELS[method],
  value: method,
}));

/** The date picker hands back Dayjs; the schema and the RPC want an ISO date. */
interface PurchaseFormFields {
  readonly supplierId: string | undefined;
  readonly purchaseDate: Dayjs;
  readonly invoiceNumber: string;
  readonly referenceNo: string;
  readonly paymentMethod: string;
  readonly paymentTerms: string;
  readonly note: string;
}

/**
 * What the form goes back to. Set explicitly rather than via `resetFields()`,
 * which replays the `initialValues` prop — and that prop is derived from the
 * draft in the store, which has only just been cleared in the same tick.
 */
const blankFields = (): PurchaseFormFields => ({
  supplierId: undefined,
  purchaseDate: dayjs(),
  invoiceNumber: '',
  referenceNo: '',
  paymentMethod: '',
  paymentTerms: '',
  note: '',
});

const sectionTitle = (step: number, title: string, subtitle: string): JSX.Element => (
  <Flex align="flex-start" gap={10}>
    <span className={styles.step} aria-hidden>
      {step}
    </span>
    <Flex vertical gap={2}>
      <Typography.Text strong style={{ fontSize: 16 }}>
        {title}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
        {subtitle}
      </Typography.Text>
    </Flex>
  </Flex>
);

export const PurchaseForm = (): JSX.Element => {
  const [form] = Form.useForm<PurchaseFormFields>();
  const lines = usePurchaseStore((state) => state.draftLines);
  const header = usePurchaseStore((state) => state.draftHeader);
  const purchases = usePurchaseStore((state) => state.purchases);
  const submitting = usePurchaseStore((state) => state.submitting);
  const draftSavedAt = usePurchaseStore((state) => state.draftSavedAt);
  const addLine = usePurchaseStore((state) => state.addLine);
  const setDraftHeader = usePurchaseStore((state) => state.setDraftHeader);
  const markDraftSaved = usePurchaseStore((state) => state.markDraftSaved);
  const resetDraft = usePurchaseStore((state) => state.resetDraft);
  const createPurchase = usePurchaseStore((state) => state.createPurchase);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const openSupplierForm = useSupplierStore((state) => state.openCreateForm);
  const runAction = useAsyncAction();
  const { message } = App.useApp();

  // Watched rather than read on submit: the supplier's details are shown as soon
  // as one is picked, so gaps are obvious before saving.
  const supplierId = Form.useWatch('supplierId', form);
  const supplier = suppliers.find((candidate) => candidate.id === supplierId) ?? null;

  const completeLines = lines.filter(isCompleteLine);
  const totals = getPurchaseTotals(completeLines, header.discountType, header.discountValue);
  const canSubmit = completeLines.length > 0;

  // A supplier's own wording is often not one of the standard terms, so it is
  // offered alongside them rather than being lost when the form saves.
  const termsOptions = useMemo(() => {
    const own = supplier?.paymentTerms.trim();
    const standard: readonly string[] = PAYMENT_TERMS_OPTIONS;
    const all = own && !standard.includes(own) ? [own, ...standard] : standard;

    return all.map((term) => ({ label: term, value: term }));
  }, [supplier]);

  const collectValues = (): PurchaseFormFields => form.getFieldsValue(true);

  const handleSubmit = async (): Promise<void> => {
    await form.validateFields();
    const fields = collectValues();

    const parsed = purchaseSchema.safeParse({
      supplierId: fields.supplierId,
      purchaseDate: fields.purchaseDate?.format('YYYY-MM-DD') ?? '',
      invoiceNumber: fields.invoiceNumber ?? '',
      referenceNo: fields.referenceNo ?? '',
      paymentMethod: fields.paymentMethod ?? '',
      paymentTerms: fields.paymentTerms ?? '',
      discountType: header.discountType,
      discountValue: header.discountValue,
      note: fields.note ?? '',
    });

    if (!parsed.success) return;

    const result = await runAction(
      () => createPurchase(parsed.data),
      'Purchase saved. The items have been added to your inventory.',
    );

    // createPurchase already cleared the draft in the store; the form fields
    // are the other half of the same reset.
    if (result.ok) form.setFieldsValue(blankFields());
  };

  // Nothing to upload: a draft is the typing, which is already persisted on
  // every keystroke. This only stamps it so the page can say when.
  const handleSaveDraft = (): void => {
    markDraftSaved();
    message.success('Draft saved on this device.');
  };

  const handleClear = (): void => {
    resetDraft();
    form.setFieldsValue(blankFields());
  };

  const actions = (
    <>
      <Button
        type="primary"
        size="large"
        block
        icon={<CheckCircleOutlined />}
        loading={submitting}
        disabled={!canSubmit}
        onClick={() => void handleSubmit()}
      >
        Save purchase
      </Button>
      <Button
        size="large"
        block
        icon={<SaveOutlined />}
        disabled={submitting}
        onClick={handleSaveDraft}
      >
        Save as draft
      </Button>
    </>
  );

  return (
    <Form<PurchaseFormFields>
      form={form}
      layout="vertical"
      size="large"
      requiredMark
      className={styles.scroller}
      initialValues={{
        supplierId: header.supplierId ?? undefined,
        purchaseDate: header.purchaseDate ? dayjs(header.purchaseDate) : dayjs(),
        invoiceNumber: header.invoiceNumber,
        referenceNo: header.referenceNo,
        paymentMethod: header.paymentMethod,
        paymentTerms: header.paymentTerms,
        note: header.note,
      }}
      // Mirrored into the store so a reload mid-delivery does not lose the
      // paperwork already typed in.
      onValuesChange={(_, all) =>
        setDraftHeader({
          supplierId: all.supplierId ?? null,
          purchaseDate: all.purchaseDate?.format('YYYY-MM-DD') ?? '',
          invoiceNumber: all.invoiceNumber ?? '',
          referenceNo: all.referenceNo ?? '',
          paymentMethod: all.paymentMethod ?? '',
          paymentTerms: all.paymentTerms ?? '',
          note: all.note ?? '',
        })
      }
    >
      <Row gutter={16}>
        <Col xs={24} xl={16}>
          <Card
            variant="outlined"
            className={styles.section}
            title={sectionTitle(1, 'Purchase details', 'Who you bought from, and their paperwork.')}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="supplierId"
                  label="Supplier"
                  required
                  rules={[...rules.supplierId]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Choose a supplier"
                    options={suppliers.map((candidate) => ({
                      label: candidate.name,
                      value: candidate.id,
                    }))}
                    notFoundContent="No suppliers yet — add one with the button below"
                  />
                </Form.Item>
                <Button
                  icon={<PlusOutlined />}
                  onClick={openSupplierForm}
                  style={{ marginBottom: 16 }}
                >
                  New supplier
                </Button>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="invoiceNumber"
                  label="Invoice number"
                  tooltip="The number on the supplier's own invoice, if it came with one."
                  rules={[...rules.invoiceNumber]}
                >
                  <Input placeholder="e.g. INV-20331" />
                </Form.Item>
              </Col>
            </Row>

            {supplier && (
              <div style={{ marginBottom: 16 }}>
                <SupplierSnapshotCard supplier={supplier} purchases={purchases} />
              </div>
            )}

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="purchaseDate"
                  label="Date received"
                  rules={[{ required: true, message: 'Date is required' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" allowClear={false} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="referenceNo"
                  label="Reference number"
                  rules={[...rules.referenceNo]}
                >
                  <Input placeholder="e.g. delivery receipt #" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Purchase order number">
                  <Tooltip title="Assigned automatically when you save.">
                    <Input disabled placeholder="Assigned on save" />
                  </Tooltip>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="paymentMethod" label="Payment method">
                  <Select
                    allowClear
                    placeholder="How is this being paid?"
                    options={PAYMENT_METHOD_OPTIONS}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="paymentTerms"
                  label="Payment terms"
                  rules={[...rules.paymentTerms]}
                >
                  <Select
                    allowClear
                    placeholder={supplier?.paymentTerms || 'Choose terms'}
                    options={termsOptions}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            variant="outlined"
            className={styles.section}
            title={sectionTitle(2, 'Items', 'Saving adds these to your stock.')}
          >
            <PurchaseItemsTable />

            <Button
              type="dashed"
              size="large"
              icon={<PlusOutlined />}
              onClick={addLine}
              style={{ marginTop: 12 }}
            >
              Add another product
            </Button>
          </Card>

          <Card
            variant="outlined"
            className={styles.section}
            title={sectionTitle(3, 'Delivery notes', 'Optional — damages, shortages, anything odd.')}
          >
            <Form.Item name="note" rules={[...rules.note]} style={{ marginBottom: 0 }}>
              <Input.TextArea
                rows={3}
                maxLength={500}
                showCount
                placeholder="Anything worth remembering about this delivery"
              />
            </Form.Item>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <PurchaseSummaryCard actions={actions} />
        </Col>
      </Row>

      <Flex
        className={styles.actionBar}
        justify="space-between"
        align="center"
        gap={16}
        wrap
      >
        <Flex vertical>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {formatNumber(totals.itemCount)} product(s) · {formatNumber(totals.totalQuantity)}{' '}
            item(s)
            {draftSavedAt && ` · draft saved ${formatDateTime(draftSavedAt)}`}
          </Typography.Text>
          <Typography.Text strong style={{ fontSize: 22, color: '#c2185b' }}>
            {formatCurrency(totals.total)}
          </Typography.Text>
        </Flex>

        <Flex gap={8} wrap>
          <Button size="large" onClick={handleClear} disabled={submitting}>
            Clear
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            loading={submitting}
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            Save purchase
          </Button>
        </Flex>
      </Flex>
    </Form>
  );
};
