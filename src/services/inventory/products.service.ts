import * as productsApi from '@/api/inventory/products.api';
import { toProduct, type Product, type ProductRemoval } from '@/types/inventory/inventory.types';
import type { ProductFormValues } from '@/schemas/inventory/product.schema';

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
    reorderLevel: values.reorderLevel,
    isActive: values.isActive,
  });
};

/**
 * Creates a product and hands it back, so the purchase screen can select the
 * new product onto the row that asked for it.
 */
export const createProduct = async (values: ProductFormValues): Promise<Product> => {
  const row = await productsApi.saveProduct({
    id: null,
    sku: values.sku.trim().toUpperCase(),
    name: values.name.trim(),
    brand: values.brand.trim(),
    categoryId: values.categoryId,
    costPrice: values.costPrice,
    unitPrice: values.unitPrice,
    reorderLevel: values.reorderLevel,
    isActive: values.isActive,
  });

  return toProduct({ ...row, categories: null });
};

export const deleteProduct = (id: string): Promise<ProductRemoval> =>
  productsApi.deleteProduct(id);
