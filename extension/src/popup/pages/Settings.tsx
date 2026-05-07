import { useEffect, useState } from 'react'
import { loadAppConfig, saveAppConfig } from '../../config/appConfig'
import { DEFAULT_LOCAL_API_BASE } from '../../constants'
import type { BackendMode } from '../../types'

type Props = { onBack: () => void }

export function Settings({ onBack }: Props) {
  const [mode, setMode] = useState<BackendMode>('local')
  const [url, setUrl] = useState(DEFAULT_LOCAL_API_BASE)
  const [localApiKey, setLocalApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void loadAppConfig().then((c) => {
      setMode(c.backendMode)
      setUrl(c.apiBaseUrl || DEFAULT_LOCAL_API_BASE)
      setLocalApiKey(c.localApiKey ?? '')
    })
  }, [])

  const apply = () => {
    void saveAppConfig({
      backendMode: mode,
      apiBaseUrl: url.trim() || DEFAULT_LOCAL_API_BASE,
      localApiKey: mode === 'local' ? localApiKey : undefined,
    }).then(() => {
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1800)
    })
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <button
        type="button"
        className="self-start text-xs text-indigo-400 hover:underline"
        onClick={onBack}
      >
        ← 返回
      </button>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-400">
          后端模式
        </label>
        <div className="flex gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-200">
            <input
              type="radio"
              name="bm"
              checked={mode === 'local'}
              onChange={() => setMode('local')}
            />
            Local（自托管 FastAPI）
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-200">
            <input
              type="radio"
              name="bm"
              checked={mode === 'hosted'}
              onChange={() => setMode('hosted')}
            />
            Hosted（远程 API，同一路由）
          </label>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          产品形态以扩展为主；后端可换实现。Cloud 指「API
          云化」，不是独立 Web 产品。
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-400">
          API Base URL
        </label>
        <input
          type="url"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={DEFAULT_LOCAL_API_BASE}
        />
        <p className="mt-1 text-[11px] text-zinc-500">
          未配置时默认 <span className="text-zinc-400">{DEFAULT_LOCAL_API_BASE}</span>（与{' '}
          <code className="text-zinc-400">/api/v1</code> 路由配合）。
        </p>
      </div>

      {mode === 'local' ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            API Key（可选）
          </label>
          <input
            type="password"
            autoComplete="off"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="自托管实例若开启扩展端鉴权时填写"
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            通过请求头 <code className="text-zinc-400">Extension-Key</code>{' '}
            发送；LLM 提供商密钥仍只应放在服务端环境变量中。
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={apply}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        {saved ? '已保存' : '保存 / 应用'}
      </button>
    </div>
  )
}
