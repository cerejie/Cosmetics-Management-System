import type { Rule } from 'antd/es/form';
import type { ZodTypeAny } from 'zod';

/**
 * Bridges a zod field schema into an antd Form rule so validation lives in
 * schemas/ and is never duplicated in component markup.
 */
export const zodRule = (schema: ZodTypeAny): Rule => ({
  validator: async (_, value: unknown) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new Error(result.error.issues[0]?.message ?? 'Invalid value');
    }
  },
});

/** Builds rules for every field of a zod object schema, keyed by field name. */
export const zodRules = <T extends Record<string, ZodTypeAny>>(
  shape: T,
): Readonly<Record<keyof T, readonly Rule[]>> => {
  const rules: Partial<Record<keyof T, readonly Rule[]>> = {};

  for (const [key, schema] of Object.entries(shape) as [keyof T, ZodTypeAny][]) {
    rules[key] = [zodRule(schema)];
  }

  return rules as Record<keyof T, readonly Rule[]>;
};
