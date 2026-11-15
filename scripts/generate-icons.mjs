// Generates PNG icons from public/icon.svg. Run: node scripts/generate-icons.mjs
import sharp from 'sharp'

const svg = 'public/icon.svg'
for (const [name, size] of [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  await sharp(svg).resize(size, size).png().toFile(`public/${name}`)
}
