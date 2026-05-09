import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' with { type: 'json' }

// 在虚拟机里可把构建直接输出到宿主机共享盘，避免再拷 dist：
//   EXTENSION_OUT_DIR=/path/to/shared/otter-extension npm run build
const outDir = process.env.EXTENSION_OUT_DIR?.trim() || 'dist'

// https://vite.dev/config/
export default defineConfig({
  build: { outDir, emptyOutDir: true },
  plugins: [tailwindcss(), react(), crx({ manifest })],
})
