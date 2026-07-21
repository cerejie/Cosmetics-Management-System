import { z } from 'zod';
import { mobileNumberSchema, tinSchema } from '@/schemas/common/contact.schema';

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(120),
  contactPerson: z.string().max(120).default(''),
  contactNumber: mobileNumberSchema,
  tin: tinSchema,
  address: z.string().max(240).default(''),
  email: z.union([z.literal(''), z.string().email('Enter a valid email address')]).default(''),
  note: z.string().max(240).default(''),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
