import { create } from 'zustand';
import * as storeProfileService from '@/services/settings/storeProfile.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { StoreProfile } from '@/types/settings/settings.types';
import type { StoreProfileFormValues } from '@/schemas/settings/storeProfile.schema';

interface StoreProfileState {
  readonly profile: StoreProfile | null;
  readonly status: AsyncStatus;
  readonly error: string | null;
  readonly saving: boolean;

  readonly loadProfile: () => Promise<void>;
  /**
   * Invoices print the profile, so screens that can print load it on mount.
   * This skips the round trip once it is already in memory.
   */
  readonly ensureProfile: () => Promise<void>;
  readonly saveProfile: (values: StoreProfileFormValues) => Promise<void>;
}

export const useStoreProfileStore = create<StoreProfileState>((set, get) => ({
  profile: null,
  status: 'idle',
  error: null,
  saving: false,

  loadProfile: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ profile: await storeProfileService.getStoreProfile(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load the store profile.') });
    }
  },

  ensureProfile: async () => {
    const { status } = get();
    if (status === 'loading' || status === 'success') return;
    await get().loadProfile();
  },

  saveProfile: async (values) => {
    set({ saving: true });
    try {
      const profile = await storeProfileService.saveStoreProfile(get().profile?.id ?? null, values);
      set({ profile, status: 'success' });
    } finally {
      set({ saving: false });
    }
  },
}));
