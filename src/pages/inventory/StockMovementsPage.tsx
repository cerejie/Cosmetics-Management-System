import { Card } from 'antd';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { StockMovementTable } from '@/components/inventory/tables/StockMovementTable';
import { useStockMovementStore } from '@/store/inventory/stockMovementStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';

export const StockMovementsPage = (): JSX.Element => {
  const movements = useStockMovementStore((state) => state.movements);
  const status = useStockMovementStore((state) => state.status);
  const error = useStockMovementStore((state) => state.error);
  const loadMovements = useStockMovementStore((state) => state.loadMovements);

  useMountEffect(() => {
    void loadMovements();
  });

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadMovements()} />;
  }

  return (
    <>
      <PageHeader
        title="Stock movements"
        description="Every change to stock, from deliveries to sales, in one audit trail."
      />

      <Card variant="outlined">
        <StockMovementTable movements={movements} loading={status === 'loading'} />
      </Card>
    </>
  );
};
