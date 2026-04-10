// Guard against runtimes that expose read-only global properties React Native mutates during setup.
const originalDefineProperty = Object.defineProperty;

Object.defineProperty = function patchedDefineProperty(target, name, descriptor) {
  if (target === globalThis && name === '__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__') {
    try {
      const existing = Object.getOwnPropertyDescriptor(target, name);

      // On reloads this global may already be locked by RN. Reuse it instead of crashing startup.
      if (existing && existing.configurable === false && existing.writable === false) {
        return target;
      }
    } catch {
      // Fall through to default behavior.
    }
  }

  try {
    return originalDefineProperty(target, name, descriptor);
  } catch (error) {
    if (error instanceof TypeError) {
      try {
        const existing = Object.getOwnPropertyDescriptor(target, name);

        // Metro/HMR can re-run module wrappers in the same runtime. Ignore duplicate
        // defines on locked properties to avoid startup crashes.
        if (existing && existing.configurable === false) {
          return target;
        }
      } catch {
        // Ignore descriptor lookup issues and rethrow original error.
      }
    }

    throw error;
  }
};

function makeWritableProperty(target, name) {
  if (!target || (typeof target !== 'object' && typeof target !== 'function')) {
    return;
  }

  try {
    const descriptor = Object.getOwnPropertyDescriptor(target, name);

    if (!descriptor) {
      return;
    }

    if (descriptor.writable || typeof descriptor.set === 'function') {
      return;
    }

    if (!descriptor.configurable) {
      return;
    }

    let currentValue;

    if (typeof descriptor.get === 'function') {
      currentValue = target[name];
    } else {
      currentValue = descriptor.value;
    }

    Object.defineProperty(target, name, {
      configurable: true,
      enumerable: descriptor.enumerable ?? true,
      get() {
        return currentValue;
      },
      set(nextValue) {
        currentValue = nextValue;
      },
    });
  } catch {
    // Some JavaScript runtimes lock these properties completely; ignore in that case.
  }
}

[
  'window',
  'self',
  'process',
  'navigator',
  'performance',
  'alert',
  '__fetchSegment',
  'RN$enableMicrotasksInReact',
  '__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__',
].forEach(name => makeWritableProperty(globalThis, name));

if (globalThis.process && typeof globalThis.process === 'object') {
  makeWritableProperty(globalThis.process, 'env');

  if (globalThis.process.env && typeof globalThis.process.env === 'object') {
    makeWritableProperty(globalThis.process.env, 'NODE_ENV');
  }
}

try {
  require('expo/AppEntry');
} finally {
  Object.defineProperty = originalDefineProperty;
}
