import { onMounted, ref } from 'vue'

const SPEAK_DELAY_MS = 80

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'))
  return (
    english.find((voice) => voice.localService && voice.lang.toLowerCase() === 'en-us')
    ?? english.find((voice) => voice.localService)
    ?? english[0]
    ?? null
  )
}

export function useEnglishSpeech() {
  const available = ref(false)
  const voice = ref<SpeechSynthesisVoice | null>(null)

  function loadVoice(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) voice.value = pickEnglishVoice(voices)
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    available.value = true
    loadVoice()
    // 语音列表在 Chrome 里异步加载，变化时重新挑选
    window.speechSynthesis.addEventListener('voiceschanged', loadVoice)
    // 部分浏览器不触发 voiceschanged，兜底再取一次
    window.setTimeout(loadVoice, 500)
  })

  function speak(text: string): void {
    if (!available.value || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synthesis = window.speechSynthesis
    synthesis.cancel()
    // Chrome 在 cancel 后同一帧 speak 会吞掉语音，延迟执行更稳
    window.setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      if (voice.value) utterance.voice = voice.value
      synthesis.resume()
      synthesis.speak(utterance)
    }, SPEAK_DELAY_MS)
  }

  return { available, speak }
}
