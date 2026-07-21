import { z } from 'zod';
import { mobileNumberSchema, tinSchema } from '@/schemas/common/contact.schema';

export const cartLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});

/** What `create_sale` accepts. The discount always reaches the server in pesos. */
export const saleSchema = z.object({
  customerName: z.string().max(120).default(''),
  /** Both optional; printed on the receipt when they are given. */
  customerContact: mobileNumberSchema,
  customerTin: tinSchema,
  paymentMethod: z.enum(['cash', 'card', 'gcash', 'bank_transfer']),
  discountAmount: z
    .number({ invalid_type_error: 'Discount is required' })
    .min(0, 'Discount cannot be negative')
    .default(0),
  note: z.string().max(240).default(''),
});

export type SaleFormValues = z.infer<typeof saleSchema>;

export const discountModeSchema = z.enum(['percent', 'amount']);

export type DiscountMode = z.infer<typeof discountModeSchema>;

/**
 * What the checkout form binds to. The percentage option is a cashier
 * convenience only — `resolveDiscountAmount()` turns it into the peso amount
 * that is validated and submitted, so sale records stay comparable.
 */
export const saleFormSchema = saleSchema
  .omit({ discountAmount: true })
  .extend({
    discountMode: discountModeSchema.default('percent'),
    discountValue: z
      .number({ invalid_type_error: 'Discount is required' })
      .min(0, 'Discount cannot be negative')
      .default(0),
  });

export type SaleFormInput = z.infer<typeof saleFormSchema>;
