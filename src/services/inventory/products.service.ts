import * as productsApi from '@/api/inventory/products.api';
import { toProduct, type Product } from '@/types/inventory/inventory.types';
import type { ProductFormValues } from '@/schemas/inventory/product.schema';
import type { StockAdjustmentValues } from '@/schemas/inventory/stockAdjustment.schema';

export const listProducts = async (): Promise<readonly Product[]> =>
  (await productsApi.fetchProducts()).map(toProduct);

/** `id` null creates, otherwise updates. */
export const saveProduct = async (
  id: string | null,
  values: ProductFormValues,
): Promise<void> => {
  await productsApi.saveProduct({
    id,
    sku: values.sku.trim().toUpperCase(),
    name: values.name.trim(),
    brand: values.brand.trim(),
    categoryId: values.categoryId,
    costPrice: values.costPrice,
    unitPrice: values.unitPrice,
    stockQuantity: values.stockQuantity,
    reorderLevel: values.reorderLevel,
    isActive: values.isActive,
    stockReason: values.stockReason.trim(),
  });
};

export const deleteProduct = (id: string): Promise<void> => productsApi.deleteProduct(id);

export const adjustStock = async (
  productId: string,
  values: StockAdjustmentValues,
): Promise<void> => {
  const signedQuantity = values.direction === 'in' ? values.quantity : -values.quantity;
  await productsApi.adjustStock(
    productId,
    signedQuantity,
    values.direction === 'in' ? 'purchase' : 'adjustment',
    values.reason.trim(),
  );
};
