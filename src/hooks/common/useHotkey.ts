import { useEffect, useRef } from 'react';

interface HotkeyOptions {
  /** Skip the binding without changing hook order (e.g. while a modal is open). */
  readonly enabled?: boolean;
}

/**
 * Binds a single key to an action for the lifetime of the component. Intended
 * for function keys, which stay usable while a field has focus — bind printable
 * keys only if the screen has no text input.
 */
export const useHotkey = (
  key: string,
  handler: () => void,
  { enabled = true }: HotkeyOptions = {},
): void => {
  // Kept in a ref so a new inline handler each render does not rebind the listener.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== key) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;

      event.preventDefault();
      handlerRef.current();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, enabled]);
};
