import { z } from 'zod';

export const cartLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});

export const saleSchema = z.object({
  customerName: z.string().max(120).default(''),
  paymentMethod: z.enum(['cash', 'card', 'gcash', 'bank_transfer']),
  discountAmount: z
    .number({ invalid_type_error: 'Discount is required' })
    .min(0, 'Discount cannot be negative')
    .default(0),
  note: z.string().max(240).default(''),
});

export type SaleFormValues = z.infer<typeof saleSchema>;
