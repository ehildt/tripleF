export const APP_VERSION = (() => {
  if (typeof __APP_VERSION__ !== 'undefined') return __APP_VERSION__;
  return (
    (globalThis as { __APP_VERSION__?: string }).__APP_VERSION__ ?? '0.0.0'
  );
})();
