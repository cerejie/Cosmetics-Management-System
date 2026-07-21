import { z } from 'zod';

export const productSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(32, 'SKU must be 32 characters or fewer')
    .regex(/^[A-Za-z0-9-]+$/, 'SKU may only contain letters, numbers and hyphens'),
  name: z.string().min(1, 'Product name is required').max(160),
  brand: z.string().max(80).default(''),
  categoryId: z.string().uuid('Select a category').nullable(),
  costPrice: z.number({ invalid_type_error: 'Cost price is required' }).min(0, 'Cost price cannot be negative'),
  unitPrice: z.number({ invalid_type_error: 'Selling price is required' }).min(0, 'Selling price cannot be negative'),
  reorderLevel: z
    .number({ invalid_type_error: 'Reorder level is required' })
    .int('Reorder level must be a whole number')
    .min(0, 'Reorder level cannot be negative'),
  isActive: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;
