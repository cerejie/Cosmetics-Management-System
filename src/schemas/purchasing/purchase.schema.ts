import { z } from 'zod';

/** One line of a purchase. Line maths is redone by `create_purchase`. */
export const purchaseLineSchema = z.object({
  productId: z.string().uuid('Choose a product'),
  quantity: z
    .number({ invalid_type_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than zero'),
  unitCost: z
    .number({ invalid_type_error: 'Cost is required' })
    .min(0, 'Cost cannot be negative'),
});

export type PurchaseLineValues = z.infer<typeof purchaseLineSchema>;

/** The purchase header. `purchaseDate` is an ISO `YYYY-MM-DD` date. */
export const purchaseSchema = z.object({
  supplierId: z.string().uuid('Choose a supplier'),
  purchaseDate: z.string().min(1, 'Date is required'),
  note: z.string().max(240).default(''),
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export const purchaseReturnSchema = z.object({
  supplierId: z.string().uuid('Choose a supplier'),
  productId: z.string().uuid('Choose a product'),
  returnDate: z.string().min(1, 'Date is required'),
  quantity: z
    .number({ invalid_type_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than zero'),
  reason: z.string().min(1, 'Give a short reason').max(240),
});

export type PurchaseReturnFormValues = z.infer<typeof purchaseReturnSchema>;
