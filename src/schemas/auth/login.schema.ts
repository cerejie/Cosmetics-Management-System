import { z } from 'zod';

export const loginSchema = z.object({
  /**
   * A username, or the superadmin's email address. Usernames cannot contain
   * '@', so anything that does is routed to Supabase Auth instead of the
   * `login` RPC.
   */
  identifier: z.string().min(1, 'Username is required').max(120),
  // Deliberately laxer than the sign-up rules: this must still accept passwords
  // set before those rules existed.
  password: z.string().min(1, 'Password is required').max(72),
});

export type LoginValues = z.infer<typeof loginSchema>;
