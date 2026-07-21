import { z } from 'zod';
import { passwordSchema, usernameSchema } from '@/schemas/auth/credentials.schema';

export const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120),
  username: usernameSchema,
  password: passwordSchema,
  // Never 'superadmin': there is exactly one, it is a Supabase Auth account,
  // and no in-app form can create it.
  role: z.enum(['admin', 'employee'], {
    errorMap: () => ({ message: 'Select a role' }),
  }),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const resetPasswordFields = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
});

export const resetPasswordSchema = resetPasswordFields.refine(
  (values) => values.password === values.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] },
);

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
