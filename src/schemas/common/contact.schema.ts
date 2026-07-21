import { z } from 'zod';

/**
 * Shared by suppliers, customers and the store profile so a phone number or a
 * TIN means the same thing everywhere it is captured, and so an invoice never
 * has to guess which format it was given.
 *
 * Both are optional — plenty of walk-in customers give neither — but a partly
 * typed one is rejected rather than saved half-finished.
 */

export const mobileNumberSchema = z
  .union([z.literal(''), z.string().regex(/^\+63 9\d{2} \d{3} \d{4}$/)], {
    // The mask keeps the field to ten digits, so the realistic failure is a
    // half-typed number or one that does not start with 9.
    errorMap: () => ({ message: 'Enter all 10 digits, starting with 9 — e.g. 917 123 4567' }),
  })
  .default('');

export const tinSchema = z
  .union([z.literal(''), z.string().regex(/^\d{3}-\d{3}-\d{3}(-\d{3})?$/)], {
    errorMap: () => ({ message: 'A TIN is 9 digits, or 12 with a branch code' }),
  })
  .default('');
