export const performanceUtils = {
  measureFunction: <T extends (...args: unknown[]) => unknown>(fn: T, label?: string): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();

      if (process.env.NODE_ENV === 'development' && label) {
        console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
      }

      return result;
    }) as T;
  },

  debounce: <T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number,
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  throttle: <T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number,
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

export const reportWebVitals = (metric: {
  id: string;
  name: string;
  value: number;
  delta: number;
  entries: PerformanceEntry[];
}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric);
  }
};
