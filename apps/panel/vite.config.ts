import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The single .env lives at the repo root and serves both apps.
const envDir = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig({
  envDir,
  plugins: [react(), tailwindcss()],
  // Single copy of React-bound packages across the workspace (avoids "invalid hook" blank screens).
  resolve: { dedupe: ['react', 'react-dom', 'react-router-dom', 'lucide-react'] },
  server: { port: 5174 },
})
