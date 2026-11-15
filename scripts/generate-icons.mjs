// Generates PNG icons for the client PWA from apps/app/public/icon.svg.
// Run from the repo root: npm run icons
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const dir = fileURLToPath(new URL('../apps/app/public/', import.meta.url))
const svg = `${dir}icon.svg`
for (const [name, size] of [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  await sharp(svg).resize(size, size).png().toFile(`${dir}${name}`)
}
