// Guard against runtimes that expose read-only global properties React Native mutates during setup.
(function makeWritableGlobalProperty(name) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);

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
      currentValue = globalThis[name];
    } else {
      currentValue = descriptor.value;
    }

    Object.defineProperty(globalThis, name, {
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
})('performance');

require('expo/AppEntry');
