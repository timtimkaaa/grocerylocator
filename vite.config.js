import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const repoBase = '/grocerynavigator/'

// Vite config stays intentionally small for now. The React plugin enables JSX,
// Fast Refresh during development, and production transforms for React.
export default defineConfig({
  base: repoBase,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // One cleanup deploy to remove stale Pages caches/service workers from
      // earlier broken releases. After the site loads cleanly again, turn this
      // back off to restore normal PWA behavior.
      selfDestroying: true,
      manifest: {
        name: 'GroceryLocator',
        short_name: 'GroceryLocator',
        theme_color: '#24523e',
        background_color: '#f6f4ed',
        display: 'standalone',
        start_url: repoBase,
        scope: repoBase,
        icons: [
          {
            src: 'pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
    }),
  ],
})
