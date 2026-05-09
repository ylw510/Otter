/**
 * Rasterize icons/otter-mascot.svg → icon16.png, icon48.png, icon128.png
 * Run: node scripts/generate-extension-icons.mjs (requires devDependency sharp)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iconsDir = path.join(__dirname, '..', 'icons')
const svgPath = path.join(iconsDir, 'otter-mascot.svg')

async function main() {
  const { default: sharp } = await import('sharp')
  const svg = fs.readFileSync(svgPath)
  for (const size of [16, 48, 128]) {
    const out = path.join(iconsDir, `icon${size}.png`)
    await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(out)
    console.log('Wrote', out)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
