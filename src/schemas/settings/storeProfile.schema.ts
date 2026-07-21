import { z } from 'zod';
import { mobileNumberSchema, tinSchema } from '@/schemas/common/contact.schema';

export const storeProfileSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(160),
  legalName: z.string().max(160).default(''),
  tin: tinSchema,
  address: z.string().max(300).default(''),
  contactNumber: mobileNumberSchema,
  email: z.union([z.literal(''), z.string().email('Enter a valid email address')]).default(''),
  website: z.string().max(160).default(''),
  invoiceFooter: z.string().max(300).default(''),
});

export type StoreProfileFormValues = z.infer<typeof storeProfileSchema>;
