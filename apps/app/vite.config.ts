import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// The single .env lives at the repo root and serves both apps.
const envDir = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig({
  envDir,
  // Single copy of React-bound packages across the workspace (avoids "invalid hook" blank screens).
  resolve: { dedupe: ['react', 'react-dom', 'react-router-dom', 'lucide-react'] },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Lucas Bueno · Preparación Física',
        short_name: 'Lucas Bueno',
        description: 'Rutinas y seguimiento con tu entrenador',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b0f17',
        theme_color: '#0b0f17',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { navigateFallback: '/index.html' },
    }),
  ],
})
