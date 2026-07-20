import { supabase } from '@/api/common/supabaseClient';
import { toApiError } from '@/api/common/apiError';
import type { CategoryRow } from '@/types/common/database.types';

export const fetchCategories = async (): Promise<readonly CategoryRow[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
    .returns<CategoryRow[]>();

  if (error) throw toApiError(error, 'Unable to load categories.');
  return data ?? [];
};

export interface CategoryPayload {
  readonly name: string;
  readonly description: string;
}

export const createCategory = async (payload: CategoryPayload): Promise<CategoryRow> => {
  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select('*')
    .single<CategoryRow>();

  if (error) throw toApiError(error, 'Unable to create the category.');
  return data;
};

export const updateCategory = async (
  id: string,
  payload: CategoryPayload,
): Promise<CategoryRow> => {
  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single<CategoryRow>();

  if (error) throw toApiError(error, 'Unable to update the category.');
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw toApiError(error, 'Unable to delete the category.');
};
