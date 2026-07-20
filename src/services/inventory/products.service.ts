import * as productsApi from '@/api/inventory/products.api';
import { toProduct, type Product } from '@/types/inventory/inventory.types';
import type { ProductFormValues, CreateProductValues } from '@/schemas/inventory/product.schema';
import type { StockAdjustmentValues } from '@/schemas/inventory/stockAdjustment.schema';

const toPayload = (values: ProductFormValues) => ({
  sku: values.sku.trim().toUpperCase(),
  name: values.name.trim(),
  brand: values.brand.trim(),
  category_id: values.categoryId,
  cost_price: values.costPrice,
  unit_price: values.unitPrice,
  reorder_level: values.reorderLevel,
  is_active: values.isActive,
});

export const listProducts = async (): Promise<readonly Product[]> =>
  (await productsApi.fetchProducts()).map(toProduct);

export const createProduct = async (values: CreateProductValues): Promise<Product> =>
  toProduct(
    await productsApi.createProduct({
      ...toPayload(values),
      stock_quantity: values.stockQuantity,
    }),
  );

export const updateProduct = async (id: string, values: ProductFormValues): Promise<Product> =>
  toProduct(await productsApi.updateProduct(id, toPayload(values)));

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
