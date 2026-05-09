import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extRoot = path.join(__dirname, '..')

function resolveExtPath(raw, fallback) {
  const s = raw?.trim()
  if (!s) return fallback
  return path.isAbsolute(s) ? s : path.resolve(extRoot, s)
}

const outDir = resolveExtPath(
  process.env.EXTENSION_OUT_DIR,
  path.join(extRoot, 'dist'),
)
const zipPath = resolveExtPath(
  process.env.EXTENSION_ZIP_PATH,
  path.join(extRoot, 'otter-extension.zip'),
)

if (!fs.existsSync(outDir)) {
  console.error('Build output not found:', outDir)
  process.exit(1)
}

fs.mkdirSync(path.dirname(zipPath), { recursive: true })

execSync(`cd "${outDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' })
console.log('Wrote', zipPath)
