import { z } from 'zod';
import { passwordSchema, usernameSchema } from '@/schemas/auth/credentials.schema';

/** The per-field shape, which is what zodRules() needs for the antd form. */
export const registerFields = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120),
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
});

/** The whole-form schema, including the cross-field password match. */
export const registerSchema = registerFields.refine(
  (values) => values.password === values.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] },
);

export type RegisterValues = z.infer<typeof registerSchema>;
