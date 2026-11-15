// Generates PNG icons for the client PWA from apps/app/public/icon.svg
// (framed icon) and icon-maskable.svg (no frame, content inside the Android safe zone).
// Run from the repo root: npm run icons
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const dir = fileURLToPath(new URL('../apps/app/public/', import.meta.url))
for (const [source, name, size] of [
  ['icon.svg', 'pwa-192x192.png', 192],
  ['icon.svg', 'pwa-512x512.png', 512],
  ['icon.svg', 'apple-touch-icon.png', 180],
  ['icon-maskable.svg', 'pwa-maskable-512x512.png', 512],
]) {
  await sharp(`${dir}${source}`).resize(size, size).png().toFile(`${dir}${name}`)
}
