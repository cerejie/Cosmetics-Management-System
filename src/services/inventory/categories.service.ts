import * as categoriesApi from '@/api/inventory/categories.api';
import { toCategory, type Category } from '@/types/inventory/inventory.types';
import type { CategoryFormValues } from '@/schemas/inventory/category.schema';

const toPayload = (values: CategoryFormValues) => ({
  name: values.name.trim(),
  description: values.description.trim(),
});

export const listCategories = async (): Promise<readonly Category[]> =>
  (await categoriesApi.fetchCategories()).map(toCategory);

export const createCategory = async (values: CategoryFormValues): Promise<Category> =>
  toCategory(await categoriesApi.createCategory(toPayload(values)));

export const updateCategory = async (
  id: string,
  values: CategoryFormValues,
): Promise<Category> => toCategory(await categoriesApi.updateCategory(id, toPayload(values)));

export const deleteCategory = (id: string): Promise<void> => categoriesApi.deleteCategory(id);
