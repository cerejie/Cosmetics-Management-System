import { create } from 'zustand';
import * as suggestionsService from '@/services/purchasing/suggestions.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { OrderSuggestion } from '@/utils/purchasing/orderSuggestions';
import type { Product } from '@/types/inventory/inventory.types';
import type { Purchase } from '@/types/purchasing/purchasing.types';

/** Preset analysis windows, in days. `custom` is driven by `customRange`. */
export type SuggestionWindow = 7 | 30 | 90 | 'custom';

interface SuggestionState {
  readonly suggestions: readonly OrderSuggestion[];
  readonly status: AsyncStatus;
  readonly error: string | null;

  readonly window: SuggestionWindow;
  readonly customRange: readonly [string, string] | null;
  readonly selectedIds: readonly string[];
  readonly trendProductId: string | null;

  readonly setWindow: (window: SuggestionWindow) => void;
  readonly setCustomRange: (range: readonly [string, string] | null) => void;
  readonly setSelectedIds: (ids: readonly string[]) => void;
  readonly openTrend: (productId: string) => void;
  readonly closeTrend: () => void;
  readonly generate: (
    products: readonly Product[],
    purchases: readonly Purchase[],
  ) => Promise<void>;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const resolveWindowDays = (
  window: SuggestionWindow,
  customRange: readonly [string, string] | null,
): number => {
  if (window !== 'custom') return window;
  if (!customRange) return 30;

  const [from, to] = customRange;
  const days = Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
  return Math.max(1, days);
};

export const useSuggestionStore = create<SuggestionState>((set, get) => ({
  suggestions: [],
  status: 'idle',
  error: null,

  window: 30,
  customRange: null,
  selectedIds: [],
  trendProductId: null,

  setWindow: (window) => set({ window }),
  setCustomRange: (customRange) => set({ customRange }),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  openTrend: (trendProductId) => set({ trendProductId }),
  closeTrend: () => set({ trendProductId: null }),

  generate: async (products, purchases) => {
    const { window, customRange } = get();
    set({ status: 'loading', error: null });

    try {
      const suggestions = await suggestionsService.generateSuggestions(
        products,
        purchases,
        resolveWindowDays(window, customRange),
      );
      set({ suggestions, status: 'success', selectedIds: [] });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to generate suggestions.') });
    }
  },
}));
