import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounce hook for performance optimization
 * Prevents rapid successive calls to state setters
 */
export function useDebounce<T>(
  value: T,
  delay: number = 100
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce callback - delays the execution of a callback
 * Useful for reducing rapid event handler calls
 */
export function useDebounceCallback<Args extends any[]>(
  callback: (...args: Args) => void | Promise<void>,
  delay: number = 100
): (...args: Args) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Debounce utility function
 * Can be used outside of React components
 */
export function debounce<Args extends any[]>(
  callback: (...args: Args) => void | Promise<void>,
  delay: number = 100
): (...args: Args) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle callback - ensures callback is called at most once every `delay` ms
 * Useful for scroll/resize event handlers
 */
export function useThrottleCallback<Args extends any[]>(
  callback: (...args: Args) => void | Promise<void>,
  delay: number = 100
): (...args: Args) => void {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Args) => {
      const now = Date.now();

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        const remaining = delay - (now - lastCallRef.current);
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
          timeoutRef.current = null;
        }, remaining);
      }
    },
    [callback, delay]
  );
}
