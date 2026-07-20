import { Card, Col, Row } from 'antd';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ProductPickerCard } from '@/components/sales/cards/ProductPickerCard';
import { CartTable } from '@/components/sales/tables/CartTable';
import { CheckoutForm } from '@/components/sales/forms/CheckoutForm';
import { useProductStore } from '@/store/inventory/productStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';

export const NewSalePage = (): JSX.Element => {
  const loadProducts = useProductStore((state) => state.loadProducts);

  useMountEffect(() => {
    void loadProducts();
  });

  return (
    <>
      <PageHeader title="New sale" description="Add items to the cart, then take payment." />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <ProductPickerCard />
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Cart" variant="outlined" style={{ marginBottom: 16 }}>
            <CartTable />
          </Card>

          <Card title="Checkout" variant="outlined">
            <CheckoutForm />
          </Card>
        </Col>
      </Row>
    </>
  );
};
