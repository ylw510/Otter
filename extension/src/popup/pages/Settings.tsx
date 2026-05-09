import { useEffect, useState } from 'react'
import { loadAppConfig, saveAppConfig } from '../../config/appConfig'
import { DEFAULT_LOCAL_API_BASE } from '../../constants'
import type { BackendMode } from '../../types'

type Props = { onBack: () => void }

const inputClass =
  'w-full rounded-lg border border-otter-border bg-otter-surface px-2.5 py-2 text-sm text-otter-ink shadow-otter-sm outline-none transition-colors placeholder:text-otter-subtle focus:border-otter-accent focus:ring-2 focus:ring-otter-ring/30'

const btnSave =
  'rounded-lg bg-otter-accent px-3 py-2 text-sm font-semibold text-white shadow-otter-sm transition-colors hover:bg-otter-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-otter-ring focus-visible:ring-offset-2 focus-visible:ring-offset-otter-canvas'

export function Settings({ onBack }: Props) {
  const [mode, setMode] = useState<BackendMode>('local')
  const [url, setUrl] = useState(DEFAULT_LOCAL_API_BASE)
  const [localApiKey, setLocalApiKey] = useState('')
  const [hoverTranslateEnabled, setHoverTranslateEnabled] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void loadAppConfig().then((c) => {
      setMode(c.backendMode)
      setUrl(c.apiBaseUrl || DEFAULT_LOCAL_API_BASE)
      setLocalApiKey(c.localApiKey ?? '')
      setHoverTranslateEnabled(c.hoverTranslateEnabled)
    })
  }, [])

  const apply = () => {
    void saveAppConfig({
      backendMode: mode,
      apiBaseUrl: url.trim() || DEFAULT_LOCAL_API_BASE,
      localApiKey: mode === 'local' ? localApiKey : undefined,
      hoverTranslateEnabled,
    }).then(() => {
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1800)
    })
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <button
        type="button"
        className="self-start text-xs font-medium text-otter-accent hover:text-otter-accent-hover hover:underline"
        onClick={onBack}
      >
        ← 返回
      </button>

      <div>
        <label className="mb-1 block text-xs font-semibold text-otter-muted">
          后端模式
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-otter-ink">
            <input
              type="radio"
              name="bm"
              checked={mode === 'local'}
              onChange={() => setMode('local')}
              className="text-otter-accent focus:ring-otter-ring"
            />
            Local（自托管 FastAPI）
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-otter-ink">
            <input
              type="radio"
              name="bm"
              checked={mode === 'hosted'}
              onChange={() => setMode('hosted')}
              className="text-otter-accent focus:ring-otter-ring"
            />
            Hosted（远程 API，同一路由）
          </label>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-otter-subtle">
          产品形态以扩展为主；后端可换实现。Cloud 指「API
          云化」，不是独立 Web 产品。
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-otter-muted">
          API Base URL
        </label>
        <input
          type="url"
          className={inputClass}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={DEFAULT_LOCAL_API_BASE}
        />
        <p className="mt-1 text-[11px] leading-snug text-otter-subtle">
          未配置时默认{' '}
          <span className="font-mono text-otter-muted">{DEFAULT_LOCAL_API_BASE}</span>（与{' '}
          <code className="rounded bg-otter-surface-raised px-0.5 font-mono text-otter-muted">
            /api/v1
          </code>{' '}
          路由配合）。
        </p>
      </div>

      {mode === 'local' ? (
        <div>
          <label className="mb-1 block text-xs font-semibold text-otter-muted">
            API Key（可选）
          </label>
          <input
            type="password"
            autoComplete="off"
            className={inputClass}
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="自托管实例若开启扩展端鉴权时填写"
          />
          <p className="mt-1 text-[11px] leading-snug text-otter-subtle">
            通过请求头{' '}
            <code className="rounded bg-otter-surface-raised px-0.5 font-mono text-otter-muted">
              Extension-Key
            </code>{' '}
            发送；LLM 提供商密钥仍只应放在服务端环境变量中。
          </p>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-semibold text-otter-muted">
          悬浮翻译
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-otter-border bg-otter-surface-raised px-3 py-2.5 shadow-otter-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-otter-border-strong text-otter-accent focus:ring-otter-ring"
            checked={hoverTranslateEnabled}
            onChange={(e) => setHoverTranslateEnabled(e.target.checked)}
          />
          <span className="text-sm text-otter-ink">
            鼠标悬停时显示词汇解释
          </span>
        </label>
        <p className="mt-1 text-[11px] leading-snug text-otter-subtle">
          默认开启；关闭后仅禁用悬浮触发，划词菜单等功能不受影响。
        </p>
      </div>

      <button type="button" onClick={apply} className={btnSave}>
        {saved ? '已保存' : '保存 / 应用'}
      </button>
    </div>
  )
}
