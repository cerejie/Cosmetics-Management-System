import { z } from 'zod';

export const loginSchema = z.object({
  /**
   * A username, or an email for accounts created outside the app (such as the
   * bootstrap superadmin). Anything containing '@' is treated as an email.
   */
  identifier: z.string().min(1, 'Username is required').max(120),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginValues = z.infer<typeof loginSchema>;
