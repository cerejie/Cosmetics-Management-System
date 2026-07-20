import { create } from 'zustand';
import * as categoriesService from '@/services/inventory/categories.service';
import { getErrorMessage } from '@/api/common/apiError';
import type { AsyncStatus } from '@/types/common/api.types';
import type { Category } from '@/types/inventory/inventory.types';
import type { CategoryFormValues } from '@/schemas/inventory/category.schema';

interface CategoryState {
  readonly categories: readonly Category[];
  readonly status: AsyncStatus;
  readonly error: string | null;
  readonly saving: boolean;
  readonly formOpen: boolean;
  readonly editingCategory: Category | null;

  readonly loadCategories: () => Promise<void>;
  readonly openCreateForm: () => void;
  readonly openEditForm: (category: Category) => void;
  readonly closeForm: () => void;
  readonly createCategory: (values: CategoryFormValues) => Promise<void>;
  readonly updateCategory: (id: string, values: CategoryFormValues) => Promise<void>;
  readonly deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  status: 'idle',
  error: null,
  saving: false,
  formOpen: false,
  editingCategory: null,

  loadCategories: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ categories: await categoriesService.listCategories(), status: 'success' });
    } catch (error) {
      set({ status: 'error', error: getErrorMessage(error, 'Unable to load categories.') });
    }
  },

  openCreateForm: () => set({ formOpen: true, editingCategory: null }),
  openEditForm: (category) => set({ formOpen: true, editingCategory: category }),
  closeForm: () => set({ formOpen: false, editingCategory: null }),

  createCategory: async (values) => {
    set({ saving: true });
    try {
      await categoriesService.createCategory(values);
      await get().loadCategories();
      set({ formOpen: false, editingCategory: null });
    } finally {
      set({ saving: false });
    }
  },

  updateCategory: async (id, values) => {
    set({ saving: true });
    try {
      await categoriesService.updateCategory(id, values);
      await get().loadCategories();
      set({ formOpen: false, editingCategory: null });
    } finally {
      set({ saving: false });
    }
  },

  deleteCategory: async (id) => {
    await categoriesService.deleteCategory(id);
    await get().loadCategories();
  },
}));
