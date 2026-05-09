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
      <div className="px-4 py-4 text-xs text-otter-muted">加载配置…</div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4 text-xs">
      <p className="text-[11px] text-otter-subtle">
        开发调试用：扩展环境与 AppConfig 摘要。
      </p>
      <dl className="space-y-2 rounded-xl border border-otter-border bg-otter-surface px-3 py-3 font-mono text-[11px] text-otter-ink shadow-otter-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-otter-subtle">扩展版本</dt>
          <dd className="truncate text-right font-medium text-otter-muted">
            {manifest.version}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-otter-subtle">Client API</dt>
          <dd className="text-right font-medium text-otter-muted">
            {CLIENT_API_VERSION}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-otter-subtle">API 前缀</dt>
          <dd className="text-right font-medium text-otter-muted">
            {API_PREFIX}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-otter-subtle">Extension ID</dt>
          <dd
            className="truncate text-right font-medium text-otter-muted"
            title={chrome.runtime.id}
          >
            {chrome.runtime.id}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-otter-subtle">backendMode</dt>
          <dd className="break-all font-medium text-otter-muted">
            {cfg.backendMode}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-otter-subtle">apiBaseUrl</dt>
          <dd className="break-all font-medium text-otter-muted">
            {cfg.apiBaseUrl || DEFAULT_LOCAL_API_BASE}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-otter-subtle">localApiKey</dt>
          <dd className="font-medium text-otter-muted">
            {cfg.localApiKey ? '（已设置）' : '（未设置）'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-otter-subtle">hoverTranslateEnabled</dt>
          <dd className="text-right font-medium text-otter-muted">
            {cfg.hoverTranslateEnabled ? 'true' : 'false'}
          </dd>
        </div>
      </dl>
    </div>
  )
}
