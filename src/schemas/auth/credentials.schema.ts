import { z } from 'zod';

/**
 * Usernames deliberately exclude '@' so that the login form can tell a username
 * from the superadmin's email address. Mirrored by the users_username_format
 * CHECK constraint in migration 0004 — keep the two in sync.
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be 32 characters or fewer')
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'Use only letters, numbers, dots, underscores or hyphens — no spaces',
  );

/** 72 bytes is bcrypt's input limit; anything past it is silently ignored. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be 72 characters or fewer');
