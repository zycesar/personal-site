import { onMounted, ref } from 'vue'

const SPEAK_DELAY_MS = 80

/**
 * 语音合成失败原因 → 可读提示。
 * 没有这层映射时，Chrome 会「不报错但没声音」，用户完全无从判断发生了什么。
 */
const SPEECH_ERROR_TEXT: Record<string, string> = {
  'not-allowed': '浏览器拦截了发声，先点击页面任意处再试一次',
  'synthesis-unavailable': '系统里没有可用的语音引擎',
  'synthesis-failed': '语音引擎启动失败',
  'language-unavailable': '系统没有安装英文语音包',
  'voice-unavailable': '指定音色不可用',
  'canceled': '发声被新的请求打断',
  'interrupted': '发声被中断',
  'network': '语音服务需要联网，当前不可用',
  'audio-busy': '音频输出设备被占用',
  'audio-hardware': '找不到音频输出设备',
  'text-too-long': '文本过长，无法朗读',
}

function isEnglishVoice(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.toLowerCase().startsWith('en')
}

export function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter(isEnglishVoice)
  return (
    english.find((voice) => voice.localService && voice.lang.toLowerCase() === 'en-us')
    ?? english.find((voice) => voice.localService)
    ?? english[0]
    ?? null
  )
}

/**
 * 没有英文音色时退回任意本地音色。
 * 少了这一步，Chrome 会把 utterance 解析成「无音色」——事件照常 start/end，但一点声音都没有。
 * 宁可口音重，也不能一声不响。
 */
export function pickFallbackVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return voices.find((voice) => voice.localService) ?? voices[0] ?? null
}

// 语音列表由系统提供，所有卡片共享同一份状态：术语页有 80 张卡，
// 每张卡各存一份只会让「有没有英文音色」在不同卡上出现不一致。
export const voice = ref<SpeechSynthesisVoice | null>(null)
export const hasEnglishVoice = ref(false)
export const speechErrorText = ref('')

function loadVoice(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    voice.value = null
    hasEnglishVoice.value = false
    return
  }
  const voices = window.speechSynthesis.getVoices()
  voice.value = pickEnglishVoice(voices)
  hasEnglishVoice.value = voice.value !== null
}

export function useEnglishSpeech() {
  const available = ref(false)

  onMounted(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      loadVoice()
      return
    }
    available.value = true
    loadVoice()
    // 语音列表在 Chrome 里异步加载，变化时重新挑选
    // loadVoice 是模块级函数引用，浏览器会去重，80 张卡实际只注册一个监听器
    window.speechSynthesis.addEventListener('voiceschanged', loadVoice)
    // 部分浏览器不触发 voiceschanged，兜底再取一次
    window.setTimeout(loadVoice, 500)
  })

  function speak(text: string): void {
    if (!available.value || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synthesis = window.speechSynthesis
    speechErrorText.value = ''
    synthesis.cancel()
    // Chrome 在 cancel 后同一帧 speak 会吞掉语音，延迟执行更稳
    window.setTimeout(() => {
      // 每次点击都重取一次音色：Chrome 的语音列表是异步就绪的，挂载时的快照可能还是空的
      const voices = synthesis.getVoices()
      const chosen = pickEnglishVoice(voices) ?? pickFallbackVoice(voices)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = chosen ? chosen.lang : 'en-US'
      utterance.rate = 0.9
      if (chosen) utterance.voice = chosen
      utterance.onerror = (event) => {
        speechErrorText.value = SPEECH_ERROR_TEXT[event.error] ?? `发音失败（${event.error}）`
      }
      synthesis.resume()
      synthesis.speak(utterance)
    }, SPEAK_DELAY_MS)
  }

  return { available, voice, hasEnglishVoice, speechErrorText, speak }
}
