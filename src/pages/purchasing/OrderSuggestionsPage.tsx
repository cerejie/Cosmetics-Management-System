import { useMemo } from 'react';
import { App, Button, Card, DatePicker, Flex, Segmented, Typography } from 'antd';
import { ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/feedback/PageHeader';
import { ErrorState } from '@/components/common/feedback/ErrorState';
import { PurchasingTabs } from '@/components/purchasing/layout/PurchasingTabs';
import { SuggestionSummaryCards } from '@/components/purchasing/cards/SuggestionSummaryCards';
import { AiInsightsCard } from '@/components/purchasing/cards/AiInsightsCard';
import { SuggestionTable } from '@/components/purchasing/tables/SuggestionTable';
import { SuggestionTrendModal } from '@/components/purchasing/modals/SuggestionTrendModal';
import { useSuggestionStore, type SuggestionWindow } from '@/store/purchasing/suggestionStore';
import { usePurchaseStore } from '@/store/purchasing/purchaseStore';
import { useSupplierStore } from '@/store/purchasing/supplierStore';
import { useProductStore } from '@/store/inventory/productStore';
import { useMountEffect } from '@/hooks/common/useMountEffect';
import {
  buildHeadlineInsights,
  isOrderable,
  summariseSuggestions,
  type OrderSuggestion,
} from '@/utils/purchasing/orderSuggestions';
import { ROUTE_PATHS } from '@/config/routes';

const WINDOW_OPTIONS: readonly { readonly label: string; readonly value: SuggestionWindow }[] = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'Custom Range', value: 'custom' },
];

export const OrderSuggestionsPage = (): JSX.Element => {
  const suggestions = useSuggestionStore((state) => state.suggestions);
  const status = useSuggestionStore((state) => state.status);
  const error = useSuggestionStore((state) => state.error);
  const period = useSuggestionStore((state) => state.window);
  const setWindow = useSuggestionStore((state) => state.setWindow);
  const customRange = useSuggestionStore((state) => state.customRange);
  const setCustomRange = useSuggestionStore((state) => state.setCustomRange);
  const selectedIds = useSuggestionStore((state) => state.selectedIds);
  const setSelectedIds = useSuggestionStore((state) => state.setSelectedIds);
  const openTrend = useSuggestionStore((state) => state.openTrend);
  const generate = useSuggestionStore((state) => state.generate);

  const products = useProductStore((state) => state.products);
  const loadProducts = useProductStore((state) => state.loadProducts);
  const purchases = usePurchaseStore((state) => state.purchases);
  const loadPurchases = usePurchaseStore((state) => state.loadPurchases);
  const addLines = usePurchaseStore((state) => state.addLines);
  const loadSuppliers = useSupplierStore((state) => state.loadSuppliers);

  const navigate = useNavigate();
  const { message } = App.useApp();

  useMountEffect(() => {
    void (async () => {
      await Promise.all([loadProducts(), loadPurchases(), loadSuppliers()]);
    })();
  });

  const summary = useMemo(() => summariseSuggestions(suggestions), [suggestions]);
  const insights = useMemo(() => buildHeadlineInsights(suggestions), [suggestions]);

  /**
   * Nothing ticked means "act on everything", which is the usual intent. The
   * table ranks every active product, so well-stocked rows are dropped here —
   * a purchase line of zero units is meaningless.
   */
  const targeted = useMemo(() => {
    const chosen =
      selectedIds.length > 0
        ? suggestions.filter((item) => selectedIds.includes(item.productId))
        : suggestions;

    return chosen.filter(isOrderable);
  }, [suggestions, selectedIds]);

  const handleGenerateSuggestions = (): void => {
    void generate(products, purchases);
  };

  const handleAddToPurchase = (suggestion: OrderSuggestion): void => {
    addLines([
      {
        productId: suggestion.productId,
        quantity: suggestion.suggestedQuantity,
        unitCost: suggestion.unitCost,
      },
    ]);
    message.success(`${suggestion.productName} added to your purchase.`);
    navigate(ROUTE_PATHS.purchasing.newPurchase);
  };

  /**
   * Fills the purchase screen rather than creating anything. Saving a purchase
   * adds stock immediately, so that decision stays with the person who has the
   * delivery in front of them.
   */
  const handleAddAllToPurchase = (): void => {
    addLines(
      targeted.map((item) => ({
        productId: item.productId,
        quantity: item.suggestedQuantity,
        unitCost: item.unitCost,
      })),
    );
    message.success(
      `${targeted.length} product(s) added to your purchase. Choose a supplier, then save.`,
    );
    navigate(ROUTE_PATHS.purchasing.newPurchase);
  };

  if (error) {
    return <ErrorState message={error} onRetry={handleGenerateSuggestions} />;
  }

  return (
    <>
      <PageHeader
        title="Purchasing"
        description="What to buy next, based on your sales and stock."
        extra={
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            disabled={targeted.length === 0}
            onClick={handleAddAllToPurchase}
          >
            Add all to a purchase
          </Button>
        }
      />

      <PurchasingTabs />

      <Card variant="outlined" style={{ marginBottom: 16 }}>
        <Flex gap={12} wrap align="center" justify="space-between">
          <Flex gap={12} wrap align="center">
            <Segmented<SuggestionWindow>
              value={period}
              onChange={setWindow}
              options={[...WINDOW_OPTIONS]}
            />

            {period === 'custom' && (
              <DatePicker.RangePicker
                format="DD MMM YYYY"
                value={customRange ? [dayjs(customRange[0]), dayjs(customRange[1])] : null}
                onChange={(range) =>
                  setCustomRange(
                    range?.[0] && range?.[1]
                      ? [range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD')]
                      : null,
                  )
                }
              />
            )}
          </Flex>

          <Button
            icon={<ReloadOutlined />}
            loading={status === 'loading'}
            onClick={handleGenerateSuggestions}
          >
            {suggestions.length === 0 ? 'Generate suggestions' : 'Refresh'}
          </Button>
        </Flex>

        {status === 'idle' && (
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
            Pick a period, then generate suggestions from your sales trend, current stock and
            purchase history.
          </Typography.Text>
        )}
      </Card>

      <SuggestionSummaryCards summary={summary} loading={status === 'loading'} />

      <AiInsightsCard insights={insights} loading={status === 'loading'} />

      <Card variant="outlined">
        <SuggestionTable
          suggestions={suggestions}
          loading={status === 'loading'}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onViewTrend={(suggestion) => openTrend(suggestion.productId)}
          onAddToPurchase={handleAddToPurchase}
        />
      </Card>

      <SuggestionTrendModal />
    </>
  );
};
