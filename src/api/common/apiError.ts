import type { PostgrestError } from '@supabase/supabase-js';

/** Normalised error surfaced by every api/ function. */
export class ApiError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

const FRIENDLY_MESSAGES: Readonly<Record<string, string>> = {
  '23505': 'That record already exists.',
  '23503': 'This record is still referenced elsewhere and cannot be removed.',
  '42501': 'You do not have permission to do that.',
  P0002: 'The requested record could not be found.',
};

/**
 * Postgres RAISE messages from our RPCs are already user-facing, so they are
 * preferred over the generic mapping.
 */
export const toApiError = (error: PostgrestError | Error | null, fallback: string): ApiError => {
  if (!error) return new ApiError(fallback);

  if ('code' in error && typeof error.code === 'string') {
    const friendly = FRIENDLY_MESSAGES[error.code];
    return new ApiError(error.message || friendly || fallback, error.code);
  }

  return new ApiError(error.message || fallback);
};

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong.'): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
};
