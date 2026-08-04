/**
 * Covia Debounce — debounce and throttle utilities.
 * Pure functions for rate-limiting rapid calls.
 */

/** Debounce: delays execution until `delayMs` after the last call. */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

/** Throttle: ensures `fn` is called at most once every `intervalMs`. */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  intervalMs: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastCall;
    if (elapsed >= intervalMs) {
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, intervalMs - elapsed);
    }
  };
}

/** Debounced async: returns a promise that resolves after the debounce delay. */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestResolve: ((value: ReturnType<T>) => void) | null = null;

  return (...args: Parameters<T>) => {
    return new Promise<ReturnType<T>>((resolve) => {
      if (timeoutId) clearTimeout(timeoutId);
      latestResolve = resolve;
      timeoutId = setTimeout(async () => {
        const result = await fn(...args);
        latestResolve?.(result);
      }, delayMs);
    });
  };
}
