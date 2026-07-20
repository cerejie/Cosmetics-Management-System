import { useEffect } from 'react';

/** Runs `effect` exactly once after mount. */
export const useMountEffect = (effect: () => void): void => {
  useEffect(effect, []); // eslint-disable-line react-hooks/exhaustive-deps
};
