import type { SelectOption } from '@/types/common/api.types';
import type { PaymentMethod } from '@/types/sales/sales.types';
import type { StockMovementType } from '@/types/inventory/inventory.types';

export const CURRENCY_CODE = 'PHP';
export const CURRENCY_LOCALE = 'en-PH';

export const DEFAULT_PAGE_SIZE = 10;

export const PAYMENT_METHOD_OPTIONS: readonly SelectOption<PaymentMethod>[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'GCash', value: 'gcash' },
  { label: 'Bank transfer', value: 'bank_transfer' },
];

export const PAYMENT_METHOD_LABELS: Readonly<Record<PaymentMethod, string>> = {
  cash: 'Cash',
  card: 'Card',
  gcash: 'GCash',
  bank_transfer: 'Bank transfer',
};

export const STOCK_MOVEMENT_LABELS: Readonly<Record<StockMovementType, string>> = {
  purchase: 'Stock in',
  adjustment: 'Adjustment',
  sale: 'Purchase',
  sale_reversal: 'Purchase reversed',
  purchase_return: 'Returned to supplier',
};
