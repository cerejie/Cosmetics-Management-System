import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be 32 characters or fewer')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Use only letters, numbers, dots, underscores or hyphens — no spaces',
    ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['superadmin', 'admin', 'employee'], {
    errorMap: () => ({ message: 'Select a role' }),
  }),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
