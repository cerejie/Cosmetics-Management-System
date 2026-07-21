import dayjs from 'dayjs';
import * as salesVelocityApi from '@/api/purchasing/salesVelocity.api';
import { buildOrderSuggestions, type OrderSuggestion } from '@/utils/purchasing/orderSuggestions';
import type { Product } from '@/types/inventory/inventory.types';
import type { Purchase } from '@/types/purchasing/purchasing.types';

/**
 * Fetches the demand signal for the window, then derives the recommendations
 * locally so the reasoning stays inspectable and testable.
 */
export const generateSuggestions = async (
  products: readonly Product[],
  purchases: readonly Purchase[],
  windowDays: number,
): Promise<readonly OrderSuggestion[]> => {
  const from = dayjs().subtract(windowDays, 'day').startOf('day').toISOString();
  const soldLines = await salesVelocityApi.fetchSoldLines(from);

  return buildOrderSuggestions(products, soldLines, purchases, windowDays);
};
