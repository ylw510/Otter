import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extRoot = path.join(__dirname, '..')
const outDir = process.env.EXTENSION_OUT_DIR?.trim()
  ? path.resolve(process.env.EXTENSION_OUT_DIR)
  : path.join(extRoot, 'dist')
const zipPath = process.env.EXTENSION_ZIP_PATH?.trim()
  ? path.resolve(process.env.EXTENSION_ZIP_PATH)
  : path.join(extRoot, 'ai-english-copilot-dist.zip')

if (!existsSync(outDir)) {
  console.error('Build output not found:', outDir)
  process.exit(1)
}

execSync(`cd "${outDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' })
console.log('Wrote', zipPath)
