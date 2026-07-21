import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(160),
  contactPerson: z.string().max(120).default(''),
  phone: z.string().max(40).default(''),
  email: z.union([z.literal(''), z.string().email('Enter a valid email address')]).default(''),
  address: z.string().max(240).default(''),
  note: z.string().max(240).default(''),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
