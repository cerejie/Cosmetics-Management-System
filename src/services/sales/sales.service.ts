import * as salesApi from '@/api/sales/sales.api';
import { toSale, type CartLine, type Sale } from '@/types/sales/sales.types';
import type { SaleFormValues } from '@/schemas/sales/sale.schema';

export const listSales = async (): Promise<readonly Sale[]> =>
  (await salesApi.fetchSales()).map(toSale);

export const createSale = async (
  lines: readonly CartLine[],
  values: SaleFormValues,
): Promise<string> => {
  const sale = await salesApi.createSale({
    items: lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
    customerName: values.customerName.trim(),
    paymentMethod: values.paymentMethod,
    discountAmount: values.discountAmount,
    note: values.note.trim(),
  });

  return sale.reference;
};

export const voidSale = async (saleId: string, reason: string): Promise<void> => {
  await salesApi.voidSale(saleId, reason.trim());
};
