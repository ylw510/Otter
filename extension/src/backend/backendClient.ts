import { API_PREFIX, CLIENT_API_VERSION } from '../api/version'
import type { AppConfig } from '../config/appConfig'
import { DEFAULT_LOCAL_API_BASE } from '../constants'
import type {
  ExplainRequest,
  ExplainResponse,
  RewriteRequest,
  RewriteResponse,
  ReviewAnswer,
  SaveWordRequest,
  TranslateRequest,
  TranslateResponse,
  Word,
} from '../types'

export type FetchWithTimeout = (
  url: string,
  init: RequestInit,
) => Promise<Response>

/**
 * Core abstraction: extension code depends on this contract, not on “local vs hosted”.
 * Both transports are HTTPS to a compatible API.
 */
export interface BackendClient {
  rewrite(input: RewriteRequest): Promise<unknown>
  explain(input: ExplainRequest): Promise<unknown>
  translate(input: TranslateRequest): Promise<unknown>
  saveWord(input: SaveWordRequest): Promise<unknown>
}

/** Service worker also proxies list/review endpoints (same backend surface). */
export interface HttpBackendClient extends BackendClient {
  getWords(): Promise<unknown>
  getReviewNext(): Promise<unknown>
  submitReview(payload: ReviewAnswer): Promise<unknown>
}

const EXTENSION_KEY_HEADER = 'Extension-Key'
const CLIENT_VERSION_HEADER = 'Client-API-Version'

class BaseHttpBackendClient implements HttpBackendClient {
  protected readonly config: AppConfig
  private readonly fetchWithTimeout: FetchWithTimeout

  constructor(config: AppConfig, fetchWithTimeout: FetchWithTimeout) {
    this.config = config
    this.fetchWithTimeout = fetchWithTimeout
  }

  /** Subclasses override to add mode-specific auth headers. */
  protected authHeaders(): Record<string, string> {
    return {}
  }

  protected baseHeaders(): Record<string, string> {
    return {
      [CLIENT_VERSION_HEADER]: CLIENT_API_VERSION,
      ...this.authHeaders(),
    }
  }

  protected resolveBaseUrl(): string {
    const u = this.config.apiBaseUrl?.trim()
    const raw = u || DEFAULT_LOCAL_API_BASE
    return raw.replace(/\/$/, '')
  }

  private async parseResponse(res: Response): Promise<unknown> {
    if (!res.ok) {
      const t = await res.text()
      return { error: t || res.statusText, status: res.status }
    }
    return res.json()
  }

  private async get(path: string): Promise<unknown> {
    const url = `${this.resolveBaseUrl()}${path}`
    const res = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: this.baseHeaders(),
    })
    return this.parseResponse(res)
  }

  private async post(path: string, body: unknown): Promise<unknown> {
    const url = `${this.resolveBaseUrl()}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.baseHeaders(),
    }
    const res = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    return this.parseResponse(res)
  }

  async rewrite(input: RewriteRequest): Promise<RewriteResponse> {
    return this.post(`${API_PREFIX}/rewrite`, {
      text: input.text,
      styles: input.styles,
    }) as Promise<RewriteResponse>
  }

  async explain(input: ExplainRequest): Promise<ExplainResponse> {
    return this.post(`${API_PREFIX}/explain`, {
      text: input.text,
      sentence: input.sentence ?? '',
    }) as Promise<ExplainResponse>
  }

  async translate(input: TranslateRequest): Promise<TranslateResponse> {
    return this.post(`${API_PREFIX}/translate`, {
      text: input.text,
      sentence: input.sentence ?? '',
      source_lang: input.source_lang ?? 'en',
      target_lang: input.target_lang ?? 'zh',
    }) as Promise<TranslateResponse>
  }

  async saveWord(input: SaveWordRequest): Promise<Word> {
    return this.post(`${API_PREFIX}/words`, {
      word: input.word,
      sentence: input.sentence,
      source_url: input.source_url,
      source_site: input.source_site,
      source_title: input.source_title,
    }) as Promise<Word>
  }

  async getWords(): Promise<unknown> {
    return this.get(`${API_PREFIX}/words`)
  }

  async getReviewNext(): Promise<unknown> {
    return this.get(`${API_PREFIX}/review/next`)
  }

  async submitReview(payload: ReviewAnswer): Promise<unknown> {
    return this.post(`${API_PREFIX}/review/answer`, payload)
  }
}

/** Self-hosted / LAN / localhost — optional extension-side key for gated deployments. */
export class LocalHttpBackendClient extends BaseHttpBackendClient {
  protected authHeaders(): Record<string, string> {
    const k = this.config.localApiKey?.trim()
    if (!k) {
      return {}
    }
    return { [EXTENSION_KEY_HEADER]: k }
  }
}

/** Remote API — no extension-stored secret in the default OSS UI (bring-your-own URL). */
export class HostedHttpBackendClient extends BaseHttpBackendClient {
  protected authHeaders(): Record<string, string> {
    return {}
  }
}

export function createBackendClient(
  config: AppConfig,
  fetchWithTimeout: FetchWithTimeout,
): HttpBackendClient {
  const Impl =
    config.backendMode === 'hosted'
      ? HostedHttpBackendClient
      : LocalHttpBackendClient
  return new Impl(config, fetchWithTimeout)
}
