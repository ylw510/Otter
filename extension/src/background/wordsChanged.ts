/** Notify popup / other extension pages that the IDB word list changed. */
export function notifyWordsChanged(): void {
  void chrome.runtime
    .sendMessage({ type: 'WORDS_CHANGED' })
    .catch(() => {
      /* no listeners (popup closed) */
    })
}
