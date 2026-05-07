import { describe, expect, it, vi } from 'vitest'
import type { AppConfig } from '../config/appConfig'
import { API_PREFIX } from '../api/version'
import { createBackendClient } from './backendClient'

describe('createBackendClient', () => {
  it('local mode attaches extension key header when set', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
      text: async () => '',
      status: 200,
      statusText: 'OK',
    } as Response)

    const cfg: AppConfig = {
      backendMode: 'local',
      apiBaseUrl: 'http://localhost:8000',
      localApiKey: 'k',
    }
    const client = createBackendClient(
      cfg,
      fetchMock as unknown as (url: string, init: RequestInit) => Promise<Response>,
    )
    await client.getWords()
    expect(fetchMock).toHaveBeenCalled()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain(`${API_PREFIX}/words`)
    const h = init.headers as Record<string, string>
    expect(h['Extension-Key']).toBe('k')
  })

  it('hosted mode does not send local extension key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
      text: async () => '',
      status: 200,
      statusText: 'OK',
    } as Response)

    const cfg: AppConfig = {
      backendMode: 'hosted',
      apiBaseUrl: 'https://api.example.com',
      localApiKey: 'k',
    }
    const client = createBackendClient(
      cfg,
      fetchMock as unknown as (url: string, init: RequestInit) => Promise<Response>,
    )
    await client.getWords()
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const h = init.headers as Record<string, string>
    expect(h['Extension-Key']).toBeUndefined()
  })
})
