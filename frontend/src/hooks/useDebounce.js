import { useEffect, useState } from 'react';

/**
 * Returns `value` only once it has stopped changing for `delay` ms.
 *
 * Used for the feed search so typing a word issues one request instead of one
 * per keystroke. The timer is cleared on every change, so only the final
 * keystroke in a burst survives.
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
