import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // Relative asset paths: the bundle works at a domain root or any sub-path.
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The app asks before reloading: a reload mid-session is safe (state is
      // persisted) but it should never happen without the user's say-so.
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'logo.png', 'logo-dark.png'],
      manifest: {
        name: 'Fokus — Pomodoro Timer',
        short_name: 'Fokus',
        description:
          'Pomodoro texnikasi bilan vaqtni boshqarish uchun sodda taymer: vazifalar, kunlik statistika, uch tilli interfeys.',
        lang: 'uz',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#faf9f7',
        theme_color: '#faf9f7',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    cssMinify: 'lightningcss',
  },
});
