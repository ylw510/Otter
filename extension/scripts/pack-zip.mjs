import { execSync, spawnSync } from 'node:child_process'
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

function createZip(srcDir, dest) {
  const absSrc = path.resolve(srcDir)
  const absDest = path.resolve(dest)
  if (process.platform === 'win32') {
    const r = spawnSync('powershell', [
      '-NoProfile',
      '-Command',
      `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${absSrc.replace(/'/g, "''")}', '${absDest.replace(/'/g, "''")}', 'Optimal', $false)`,
    ], { stdio: 'inherit', shell: true })
    if (r.status !== 0) process.exit(r.status ?? 1)
  } else {
    execSync(`cd "${absSrc}" && zip -r "${absDest}" .`, { stdio: 'inherit' })
  }
}

createZip(outDir, zipPath)
console.log('Wrote', zipPath)