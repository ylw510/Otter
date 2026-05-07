import { useEffect, useState } from 'react'
import { loadAppConfig, type AppConfig } from '../../config/appConfig'
import { API_PREFIX, CLIENT_API_VERSION } from '../../api/version'
import { DEFAULT_LOCAL_API_BASE } from '../../constants'

export function Test() {
  const manifest = chrome.runtime.getManifest()
  const [cfg, setCfg] = useState<AppConfig | null>(null)

  useEffect(() => {
    void loadAppConfig().then(setCfg)
  }, [])

  if (!cfg) {
    return (
      <div className="px-4 py-4 text-xs text-zinc-500">加载配置…</div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4 text-xs">
      <p className="text-[11px] text-zinc-500">
        开发调试用：扩展环境与 AppConfig 摘要。
      </p>
      <dl className="space-y-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 font-mono text-[11px] text-zinc-300">
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">扩展版本</dt>
          <dd className="truncate text-right text-zinc-200">{manifest.version}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Client API</dt>
          <dd className="text-right text-zinc-200">{CLIENT_API_VERSION}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">API 前缀</dt>
          <dd className="text-right text-zinc-200">{API_PREFIX}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Extension ID</dt>
          <dd className="truncate text-right text-zinc-200" title={chrome.runtime.id}>
            {chrome.runtime.id}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-zinc-500">backendMode</dt>
          <dd className="break-all text-zinc-200">{cfg.backendMode}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-zinc-500">apiBaseUrl</dt>
          <dd className="break-all text-zinc-200">
            {cfg.apiBaseUrl || DEFAULT_LOCAL_API_BASE}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-zinc-500">localApiKey</dt>
          <dd className="text-zinc-200">
            {cfg.localApiKey ? '（已设置）' : '（未设置）'}
          </dd>
        </div>
      </dl>
    </div>
  )
}
