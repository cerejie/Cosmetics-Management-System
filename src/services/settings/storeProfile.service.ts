import * as storeProfileApi from '@/api/settings/storeProfile.api';
import { toStoreProfile, type StoreProfile } from '@/types/settings/settings.types';
import type { StoreProfileFormValues } from '@/schemas/settings/storeProfile.schema';

export const getStoreProfile = async (): Promise<StoreProfile | null> => {
  const row = await storeProfileApi.fetchStoreProfile();
  return row === null ? null : toStoreProfile(row);
};

export const saveStoreProfile = async (
  id: string | null,
  values: StoreProfileFormValues,
): Promise<StoreProfile> =>
  toStoreProfile(
    await storeProfileApi.saveStoreProfile({
      id,
      storeName: values.storeName.trim(),
      legalName: values.legalName.trim(),
      tin: values.tin.trim(),
      address: values.address.trim(),
      contactNumber: values.contactNumber.trim(),
      email: values.email.trim(),
      website: values.website.trim(),
      invoiceFooter: values.invoiceFooter.trim(),
    }),
  );
