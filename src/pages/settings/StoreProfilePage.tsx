import { Alert, Button, Card, Col, Row, Skeleton } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { StoreProfileForm } from '@/components/settings/forms/StoreProfileForm';
import { useStoreProfileStore } from '@/store/settings/storeProfileStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import { useAsyncAction } from '@/hooks/common/useAsyncAction';
import { printInvoice } from '@/utils/common/invoiceHtml';
import { toIssuerParty, invoiceFooter, invoiceTerms } from '@/utils/common/invoiceParties';
import { formatDate } from '@/utils/common/format';
import type { StoreProfileFormValues } from '@/schemas/settings/storeProfile.schema';
import type { InvoiceDocument } from '@/types/common/invoice.types';
import type { StoreProfile } from '@/types/settings/settings.types';

/**
 * A throwaway invoice so the admin can see what the letterhead looks like
 * before a real customer gets one.
 */
const toSampleInvoice = (profile: StoreProfile | null): InvoiceDocument => ({
  title: 'INVOICE',
  referenceLabel: 'Invoice Number',
  reference: 'SO-000000',
  date: formatDate(new Date().toISOString()),
  issuer: toIssuerParty(profile),
  recipientLabel: 'Bill to:',
  recipient: {
    name: 'Sample customer',
    lines: [
      { value: '+63 917 000 0000' },
      { label: 'TIN', value: '000-000-000-000' },
      { label: 'Payment', value: 'Cash' },
    ],
  },
  unitPriceLabel: 'Rate',
  lines: [
    {
      key: 'sample-1',
      description: 'Hydrating Facial Cleanser 150ml',
      sku: 'SKN-001',
      quantity: 2,
      unitPrice: 450,
      tax: 0,
      amount: 900,
    },
    {
      key: 'sample-2',
      description: 'Matte Lipstick — Rosewood',
      sku: 'LIP-014',
      quantity: 1,
      unitPrice: 380,
      tax: 0,
      amount: 380,
    },
  ],
  totals: [
    { label: 'Subtotal', amount: 1280 },
    { label: 'Discount', amount: 0 },
    { label: 'Tax', amount: 0 },
    { label: 'Total', amount: 1280, emphasis: true },
  ],
  note: 'This is a sample — no sale was recorded.',
  terms: invoiceTerms(profile),
  footer: invoiceFooter(profile),
  preparedBy: '',
  watermark: 'SAMPLE',
});

export const StoreProfilePage = (): JSX.Element => {
  const profile = useStoreProfileStore((state) => state.profile);
  const status = useStoreProfileStore((state) => state.status);
  const error = useStoreProfileStore((state) => state.error);
  const saving = useStoreProfileStore((state) => state.saving);
  const loadProfile = useStoreProfileStore((state) => state.loadProfile);
  const saveProfile = useStoreProfileStore((state) => state.saveProfile);
  const runAction = useAsyncAction();

  useMountEffect(() => {
    void loadProfile();
  });

  const handleSubmit = (values: StoreProfileFormValues): void => {
    void runAction(() => saveProfile(values), 'Store profile saved.');
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadProfile()} />;
  }

  return (
    <>
      <PageHeader
        title="Store profile"
        description="Your business details. These print at the top of every invoice and receipt."
        extra={
          <Button icon={<PrinterOutlined />} onClick={() => printInvoice(toSampleInvoice(profile))}>
            Preview invoice
          </Button>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card variant="outlined">
            {status === 'loading' ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
              <StoreProfileForm profile={profile} saving={saving} onSubmit={handleSubmit} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Alert
            type="info"
            showIcon
            message="Where these appear"
            description={
              <>
                Every printed document — sales invoices, purchase invoices and supplier statements —
                uses this block as its letterhead. Blank fields are simply left off the page, so fill
                in what your customers need to see and leave the rest empty.
              </>
            }
          />
        </Col>
      </Row>
    </>
  );
};
