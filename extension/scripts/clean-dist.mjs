/**
 * 构建前删除输出目录，避免旧版 chunk（如 index.ts-xxx.js）残留，
 * 被 Chrome 继续加载进 Service Worker 导致 document is not defined。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raw = process.env.EXTENSION_OUT_DIR?.trim()
const abs = raw
  ? path.isAbsolute(raw)
    ? raw
    : path.resolve(__dirname, '..', raw)
  : path.resolve(__dirname, '..', 'dist')

try {
  fs.rmSync(abs, { recursive: true, force: true })
} catch (e) {
  const err = /** @type {NodeJS.ErrnoException} */ (e)
  if (err.code !== 'ENOENT') throw err
}
