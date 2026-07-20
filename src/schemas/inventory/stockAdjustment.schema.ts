import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  direction: z.enum(['in', 'out']),
  quantity: z
    .number({ invalid_type_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than zero'),
  reason: z.string().min(1, 'Give a short reason for this adjustment').max(240),
});

export type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>;
