// Minimal performance API polyfill for environments lacking User Timing APIs
/* eslint-disable @typescript-eslint/no-explicit-any */
const g: any = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : {}));

if (!g.performance) {
  g.performance = {};
}

const perf: any = g.performance;

if (typeof perf.now !== 'function') {
  // prefer high-resolution time when available
  perf.now = () => Date.now();
}

// No-op implementations so libraries can safely call them
if (typeof perf.mark !== 'function') {
  perf.mark = () => {};
}
if (typeof perf.clearMarks !== 'function') {
  perf.clearMarks = () => {};
}
if (typeof perf.clearMeasures !== 'function') {
  perf.clearMeasures = () => {};
}
if (typeof perf.measure !== 'function') {
  perf.measure = () => null;
}
if (typeof perf.getEntriesByName !== 'function') {
  perf.getEntriesByName = () => [];
}
if (typeof perf.getEntriesByType !== 'function') {
  perf.getEntriesByType = () => [];
}

export {};
