import * as purchasesApi from '@/api/purchasing/purchases.api';
import {
  toPurchase,
  toPurchaseEdit,
  type Purchase,
  type PurchaseDraftLine,
  type PurchaseEdit,
} from '@/types/purchasing/purchasing.types';
import { purchaseDetailsSchema, purchaseLineSchema } from '@/schemas/purchasing/purchase.schema';
import type {
  PurchaseDetailsFormValues,
  PurchaseFormValues,
} from '@/schemas/purchasing/purchase.schema';

export const listPurchases = async (): Promise<readonly Purchase[]> =>
  (await purchasesApi.fetchPurchases()).map(toPurchase);

/**
 * Validates each typed line before it leaves the client. The server revalidates
 * and reprices everything — this only keeps the error message near the field.
 */
const toItemPayload = (lines: readonly PurchaseDraftLine[]) =>
  lines.map((line) => {
    const parsed = purchaseLineSchema.parse({
      productId: line.productId,
      quantity: line.quantity,
      unitCost: line.unitCost,
      discountType: line.discountType,
      discountValue: line.discountValue,
    });

    return {
      product_id: parsed.productId,
      quantity: parsed.quantity,
      unit_cost: parsed.unitCost,
      discount_type: parsed.discountType,
      discount_value: parsed.discountValue,
    };
  });

/** Saves the purchase and adds the goods to inventory. Returns the PO number. */
export const createPurchase = async (
  values: PurchaseFormValues,
  lines: readonly PurchaseDraftLine[],
): Promise<string> => {
  const purchase = await purchasesApi.createPurchase({
    supplierId: values.supplierId,
    purchaseDate: values.purchaseDate,
    note: values.note.trim(),
    invoiceNumber: values.invoiceNumber,
    referenceNo: values.referenceNo,
    paymentMethod: values.paymentMethod,
    paymentTerms: values.paymentTerms,
    discountType: values.discountType,
    discountValue: values.discountValue,
    items: toItemPayload(lines),
  });

  return purchase.reference;
};

/** Saves the paperwork corrections. Stock, costs and totals are untouched. */
export const updatePurchaseDetails = async (
  id: string,
  values: PurchaseDetailsFormValues,
): Promise<void> => {
  const parsed = purchaseDetailsSchema.parse(values);

  await purchasesApi.updatePurchaseDetails({
    id,
    purchaseDate: parsed.purchaseDate,
    invoiceNumber: parsed.invoiceNumber,
    referenceNo: parsed.referenceNo,
    paymentMethod: parsed.paymentMethod,
    paymentTerms: parsed.paymentTerms,
    note: parsed.note.trim(),
  });
};

export const listPurchaseEdits = async (
  purchaseId: string,
): Promise<readonly PurchaseEdit[]> =>
  (await purchasesApi.fetchPurchaseEdits(purchaseId)).map(toPurchaseEdit);
