import type { SelectOption } from '@/types/common/api.types';
import type { PaymentMethod } from '@/types/sales/sales.types';
import type { StockMovementType } from '@/types/inventory/inventory.types';

/**
 * Accounts are identified by username. Supabase Auth needs an email, so one is
 * derived deterministically and never delivered to. Must match
 * INTERNAL_EMAIL_DOMAIN in supabase/functions/create-user/index.ts and
 * username_to_email() in migration 0003.
 */
export const INTERNAL_EMAIL_DOMAIN = 'cosmetics.local';

export const usernameToEmail = (username: string): string =>
  `${username.trim().toLowerCase()}@${INTERNAL_EMAIL_DOMAIN}`;

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
  sale: 'Sale',
  sale_reversal: 'Sale reversed',
};
