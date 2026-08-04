import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/family-chores/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Family Chores',
        short_name: 'Chores',
        description: 'The family weekly chore chart',
        theme_color: '#2e9e6b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/family-chores/',
        start_url: '/family-chores/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell so it opens offline (airplane mode). Firestore
        // data offline is handled separately by persistentLocalCache.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/family-chores/index.html',
        // The Firebase bundle is large; lift Workbox's precache size ceiling.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
})
