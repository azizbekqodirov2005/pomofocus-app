/** Test stub for Vite's `virtual:pwa-register` module (no service worker in jsdom). */
export function registerSW(_options?: unknown): (reload?: boolean) => Promise<void> {
  return async () => undefined;
}
