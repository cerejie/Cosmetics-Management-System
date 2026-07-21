import { useEffect } from 'react';
import { Button, Col, Flex, Form, Input, Row } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { MobileNumberInput } from '@/components/common/inputs/MobileNumberInput';
import { TinInput } from '@/components/common/inputs/TinInput';
import {
  storeProfileSchema,
  type StoreProfileFormValues,
} from '@/schemas/settings/storeProfile.schema';
import { zodRules } from '@/utils/common/formRules';
import type { StoreProfile } from '@/types/settings/settings.types';

const rules = zodRules(storeProfileSchema.shape);

interface StoreProfileFormProps {
  readonly profile: StoreProfile | null;
  readonly saving: boolean;
  readonly onSubmit: (values: StoreProfileFormValues) => void;
}

const toInitialValues = (profile: StoreProfile | null): StoreProfileFormValues => ({
  storeName: profile?.storeName ?? '',
  legalName: profile?.legalName ?? '',
  tin: profile?.tin ?? '',
  address: profile?.address ?? '',
  contactNumber: profile?.contactNumber ?? '',
  email: profile?.email ?? '',
  website: profile?.website ?? '',
  invoiceFooter: profile?.invoiceFooter ?? '',
});

export const StoreProfileForm = ({
  profile,
  saving,
  onSubmit,
}: StoreProfileFormProps): JSX.Element => {
  const [form] = Form.useForm<StoreProfileFormValues>();

  // The profile arrives after the first render, so the fields are refilled
  // once it loads rather than staying on the empty initial values.
  useEffect(() => {
    form.setFieldsValue(toInitialValues(profile));
  }, [form, profile]);

  const handleFinish = (values: StoreProfileFormValues): void => {
    const parsed = storeProfileSchema.safeParse(values);
    if (parsed.success) onSubmit(parsed.data);
  };

  return (
    <Form<StoreProfileFormValues>
      form={form}
      layout="vertical"
      size="large"
      requiredMark
      onFinish={handleFinish}
      initialValues={toInitialValues(profile)}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="storeName"
            label="Store name"
            rules={[...rules.storeName]}
            tooltip="The large name at the top of every invoice."
          >
            <Input placeholder="Bella Cosmetics" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="legalName"
            label="Registered business name"
            rules={[...rules.legalName]}
          >
            <Input placeholder="Bella Cosmetics Trading Corp." />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="address" label="Business address" rules={[...rules.address]}>
        <Input.TextArea rows={2} placeholder="123 Ortigas Avenue, Pasig City, Metro Manila" />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="tin" label="TIN" rules={[...rules.tin]}>
            <TinInput />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="contactNumber" label="Mobile number" rules={[...rules.contactNumber]}>
            <MobileNumberInput />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="email" label="Email" rules={[...rules.email]}>
            <Input placeholder="hello@bellacosmetics.ph" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="website" label="Website" rules={[...rules.website]}>
            <Input placeholder="bellacosmetics.ph" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="invoiceFooter"
        label="Invoice footer"
        rules={[...rules.invoiceFooter]}
        tooltip="A closing line on every printed invoice — thanks, return policy, or terms."
      >
        <Input.TextArea rows={2} placeholder="Thank you for your business!" />
      </Form.Item>

      <Flex justify="end">
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
          Save profile
        </Button>
      </Flex>
    </Form>
  );
};
