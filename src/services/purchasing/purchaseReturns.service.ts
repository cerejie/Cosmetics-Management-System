import * as purchaseReturnsApi from '@/api/purchasing/purchaseReturns.api';
import { toPurchaseReturn, type PurchaseReturn } from '@/types/purchasing/purchasing.types';
import type { PurchaseReturnFormValues } from '@/schemas/purchasing/purchase.schema';

export const listPurchaseReturns = async (): Promise<readonly PurchaseReturn[]> =>
  (await purchaseReturnsApi.fetchPurchaseReturns()).map(toPurchaseReturn);

export const createPurchaseReturn = async (
  values: PurchaseReturnFormValues,
): Promise<string> => {
  const created = await purchaseReturnsApi.createPurchaseReturn({
    supplierId: values.supplierId,
    productId: values.productId,
    quantity: values.quantity,
    reason: values.reason.trim(),
    returnDate: values.returnDate,
  });

  return created.reference;
};
