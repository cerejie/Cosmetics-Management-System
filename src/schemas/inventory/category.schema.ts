import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(80),
  description: z.string().max(240).default(''),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
