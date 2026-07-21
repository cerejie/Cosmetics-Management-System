import { z } from 'zod';
import { mobileNumberSchema, tinSchema } from '@/schemas/common/contact.schema';

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(160),
  contactPerson: z.string().max(120).default(''),
  phone: mobileNumberSchema,
  email: z.union([z.literal(''), z.string().email('Enter a valid email address')]).default(''),
  address: z.string().max(240).default(''),
  /** Printed on purchase invoices and supplier statements. */
  tin: tinSchema,
  paymentTerms: z.string().max(120).default(''),
  note: z.string().max(240).default(''),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
