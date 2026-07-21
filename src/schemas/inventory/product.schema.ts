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
  /**
   * Editable on both create and edit. Any change is written to the stock
   * movement log by the save_product RPC, so the audit trail stays complete.
   */
  stockQuantity: z
    .number({ invalid_type_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative'),
  reorderLevel: z
    .number({ invalid_type_error: 'Reorder level is required' })
    .int('Reorder level must be a whole number')
    .min(0, 'Reorder level cannot be negative'),
  isActive: z.boolean().default(true),
  /** Shown only when editing an existing product's quantity. */
  stockReason: z.string().max(240).default(''),
});

export type ProductFormValues = z.infer<typeof productSchema>;
