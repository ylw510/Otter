/** Read aloud in popup via the browser TTS engine (no extra permissions). */
export function speakText(text: string, lang = 'en-US'): void {
  const trimmed = text.trim()
  if (!trimmed) return
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(trimmed)
  utterance.lang = lang
  window.speechSynthesis.speak(utterance)
}
