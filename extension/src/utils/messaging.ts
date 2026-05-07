import type { Message } from '../types'

/** 略长于 background 里 API fetch 超时，防止 popup 永久「加载中」 */
const EXTENSION_MESSAGE_TIMEOUT_MS = 18_000

/**
 * `chrome.runtime.sendMessage` 在 Service Worker / fetch 异常时可能长时间不返回；
 * 与 Promise.race 结合，超时后由调用方走本地回落逻辑。
 * sendMessage 在扩展上下文失效时可能同步抛错 —— 须转成 rejected Promise，避免逃逸。
 */
export function raceSendMessage<T>(msg: Message): Promise<T> {
  let pending: Promise<T>
  try {
    pending = chrome.runtime.sendMessage(msg) as Promise<T>
  } catch (e) {
    return Promise.reject(e)
  }
  return Promise.race([
    pending,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Extension message timeout'))
      }, EXTENSION_MESSAGE_TIMEOUT_MS)
    }),
  ])
}
