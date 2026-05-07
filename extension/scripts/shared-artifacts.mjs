/**
 * 将扩展构建产物输出到 VMware 共享盘（默认 /mnt/hgfs/Share）。
 * 宿主机 Windows 侧一般为「共享文件夹」下的 ai-english-copilot-dist。
 *
 * 覆盖共享根路径：EXTENSION_SHARED_ROOT=/your/path node scripts/shared-artifacts.mjs
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extRoot = path.join(__dirname, '..')

const sharedRoot =
  process.env.EXTENSION_SHARED_ROOT?.trim() || '/mnt/hgfs/Share'
const outDir = path.join(sharedRoot, 'ai-english-copilot-dist')

if (!fs.existsSync(sharedRoot)) {
  console.error(
    '[shared-artifacts] 共享根目录不存在:',
    sharedRoot,
    '\n请确认 VMware「共享文件夹」已挂载（例如 open-vm-tools + hgfs）。',
  )
  process.exit(1)
}

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true })
}
fs.mkdirSync(outDir, { recursive: true })

execSync('npm run build', {
  cwd: extRoot,
  stdio: 'inherit',
  env: { ...process.env, EXTENSION_OUT_DIR: outDir },
})

console.log('\n[shared-artifacts] 构建完成 →', outDir)

const wantZip = process.argv.includes('--zip')
if (wantZip) {
  const zipPath = path.join(sharedRoot, 'ai-english-copilot-dist.zip')
  execSync(`cd "${outDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' })
  console.log('[shared-artifacts] zip →', zipPath)
}
