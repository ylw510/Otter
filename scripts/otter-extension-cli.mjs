#!/usr/bin/env node
/**
 * 仓库根目录扩展构建 CLI（默认产物：build/extension、build/releases/*.zip）
 * 由 ./otter-extension.sh 或 npm run build:extension / pack:extension 调用。
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const EXT = path.join(ROOT, 'extension')

const DEFAULT_UNPACKED = path.join(ROOT, 'build', 'extension')
const DEFAULT_ZIP = path.join(
  ROOT,
  'build',
  'releases',
  'otter-extension.zip',
)

function usage() {
  console.log(`用法: ./otter-extension.sh <command> [选项]

命令:
  install       安装扩展依赖（extension 内 npm ci）
  build         构建未打包扩展目录
  pack          构建并打 zip
  lint          ESLint
  test          Vitest

选项:
  build  [-o|--out <DIR>]     输出目录（默认: build/extension）
  pack   [-o|--out <路径>]    zip 文件路径，或目录（在目录内生成 otter-extension.zip）
         [--dist <DIR>]       构建阶段输出目录（默认与 build 相同: build/extension）

示例:
  ./otter-extension.sh install && ./otter-extension.sh build
  ./otter-extension.sh build -o ./out/ext
  ./otter-extension.sh pack -o ~/Downloads
  ./otter-extension.sh pack -o ./dist/foo.zip --dist ./out/ext
`)
}

function spawnNpm(args, env = {}) {
  const r = spawnSync('npm', args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  })
  const code = r.status ?? 1
  if (code !== 0) process.exit(code)
}

function resolveUserPath(p) {
  if (!p) return null
  const expanded = p.startsWith('~')
    ? path.join(process.env.HOME ?? '', p.slice(1))
    : p
  return path.isAbsolute(expanded)
    ? path.normalize(expanded)
    : path.resolve(ROOT, expanded)
}

function resolveUnpackedDir(flag) {
  return resolveUserPath(flag) ?? DEFAULT_UNPACKED
}

function resolveZipPath(flag) {
  if (!flag) return DEFAULT_ZIP
  const p = resolveUserPath(flag)
  if (p.endsWith('.zip')) {
    return p
  }
  try {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return p
    }
  } catch {
    // ignore
  }
  fs.mkdirSync(p, { recursive: true })
  return path.join(p, 'otter-extension.zip')
}

function parseBuildArgs(argv) {
  let out = null
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-o' || a === '--out') {
      out = argv[++i]
      if (out === undefined) throw new Error('缺少 -o 路径')
    } else {
      throw new Error(`未知参数: ${a}`)
    }
  }
  return { out }
}

function parsePackArgs(argv) {
  let out = null
  let dist = null
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-o' || a === '--out') {
      out = argv[++i]
      if (out === undefined) throw new Error('缺少 -o 路径')
    } else if (a === '--dist') {
      dist = argv[++i]
      if (dist === undefined) throw new Error('缺少 --dist 路径')
    } else {
      throw new Error(`未知参数: ${a}`)
    }
  }
  return { out, dist }
}

function cmdBuild(argv) {
  const { out } = parseBuildArgs(argv)
  const dir = resolveUnpackedDir(out)
  fs.mkdirSync(dir, { recursive: true })
  spawnNpm(['--prefix', 'extension', 'run', 'build'], {
    EXTENSION_OUT_DIR: dir,
  })
}

function cmdPack(argv) {
  const { out, dist } = parsePackArgs(argv)
  const unpacked = resolveUnpackedDir(dist)
  const zipFile = resolveZipPath(out)
  fs.mkdirSync(unpacked, { recursive: true })
  fs.mkdirSync(path.dirname(zipFile), { recursive: true })
  spawnNpm(['--prefix', 'extension', 'run', 'pack'], {
    EXTENSION_OUT_DIR: unpacked,
    EXTENSION_ZIP_PATH: zipFile,
  })
}

function cmdInstall() {
  spawnNpm(['--prefix', 'extension', 'ci'])
}

function cmdLint() {
  spawnNpm(['--prefix', 'extension', 'run', 'lint'])
}

function cmdTest() {
  spawnNpm(['--prefix', 'extension', 'run', 'test'])
}

const cmd = process.argv[2]
const rest = process.argv.slice(3)

try {
  switch (cmd) {
    case 'install':
      if (rest.length) throw new Error('install 不接受额外参数')
      cmdInstall()
      break
    case 'build':
      cmdBuild(rest)
      break
    case 'pack':
      cmdPack(rest)
      break
    case 'lint':
      if (rest.length) throw new Error('lint 不接受额外参数')
      cmdLint()
      break
    case 'test':
      if (rest.length) throw new Error('test 不接受额外参数')
      cmdTest()
      break
    case 'help':
    case '-h':
    case '--help':
      usage()
      break
    default:
      if (!cmd) {
        usage()
        process.exit(1)
      }
      throw new Error(`未知命令: ${cmd}`)
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
  usage()
  process.exit(1)
}
