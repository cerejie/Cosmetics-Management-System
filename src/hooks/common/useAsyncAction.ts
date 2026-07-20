import { useCallback } from 'react';
import { App } from 'antd';
import { getErrorMessage } from '@/api/common/apiError';

export type ActionResult<T> = { readonly ok: true; readonly data: T } | { readonly ok: false };

type RunAction = <T>(action: () => Promise<T>, successMessage?: string) => Promise<ActionResult<T>>;

/**
 * Wraps a store mutation so every call site gets consistent success and error
 * toasts without repeating try/catch. The discriminated result keeps success
 * distinguishable from failure even when the action resolves to void.
 */
export const useAsyncAction = (): RunAction => {
  const { message } = App.useApp();

  return useCallback(
    async <T,>(action: () => Promise<T>, successMessage?: string): Promise<ActionResult<T>> => {
      try {
        const data = await action();
        if (successMessage) message.success(successMessage);
        return { ok: true, data };
      } catch (error) {
        message.error(getErrorMessage(error));
        return { ok: false };
      }
    },
    [message],
  );
};
