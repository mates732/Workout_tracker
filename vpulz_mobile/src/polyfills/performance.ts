// Minimal performance API polyfill for environments lacking User Timing APIs.
// Newer RN/Expo runtimes may expose non-writable global properties, so every write here is guarded.
/* eslint-disable @typescript-eslint/no-explicit-any */
const g: any =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof global !== 'undefined'
      ? global
      : typeof window !== 'undefined'
        ? window
        : {};

function getOrCreatePerformance(target: any): any {
  const existing = target?.performance;
  if (existing && typeof existing === 'object') {
    return existing;
  }

  try {
    const descriptor = Object.getOwnPropertyDescriptor(target, 'performance');

    if (!descriptor) {
      Object.defineProperty(target, 'performance', {
        value: {},
        writable: true,
        configurable: true,
      });
      return target.performance;
    }

    if (descriptor.writable || typeof descriptor.set === 'function') {
      target.performance = {};
      return target.performance;
    }
  } catch {
    // Ignore when global is locked down and fall back to a local object.
  }

  return {};
}

function defineFnIfMissing(target: any, key: string, value: (...args: any[]) => any) {
  if (typeof target?.[key] === 'function') {
    return;
  }

  try {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);

    if (!descriptor) {
      if (Object.isExtensible(target)) {
        Object.defineProperty(target, key, {
          value,
          writable: true,
          configurable: true,
        });
      }
      return;
    }

    if (descriptor.writable || typeof descriptor.set === 'function') {
      target[key] = value;
    }
  } catch {
    // Ignore when runtime disallows overriding this property.
  }
}

const perf: any = getOrCreatePerformance(g);

// Prefer high-resolution time when available; Date.now is a safe fallback.
defineFnIfMissing(perf, 'now', () => Date.now());

// No-op implementations so libraries can safely call User Timing APIs.
defineFnIfMissing(perf, 'mark', () => {});
defineFnIfMissing(perf, 'clearMarks', () => {});
defineFnIfMissing(perf, 'clearMeasures', () => {});
defineFnIfMissing(perf, 'measure', () => null);
defineFnIfMissing(perf, 'getEntriesByName', () => []);
defineFnIfMissing(perf, 'getEntriesByType', () => []);

export {};
