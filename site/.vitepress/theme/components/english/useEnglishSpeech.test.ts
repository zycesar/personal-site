import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import { useEnglishSpeech } from './useEnglishSpeech'

enableAutoUnmount(afterEach)

function makeVoice(lang: string, localService: boolean, name: string): SpeechSynthesisVoice {
  return { lang, localService, name, default: false, voiceURI: name } as unknown as SpeechSynthesisVoice
}

interface UtteranceStub {
  text: string
  lang: string
  rate: number
  voice: SpeechSynthesisVoice | null
}

let captured: ReturnType<typeof useEnglishSpeech> | undefined

const Host = defineComponent({
  setup() {
    captured = useEnglishSpeech()
    return () => null
  },
})

function mockSynthesis(voices: SpeechSynthesisVoice[]) {
  const synthesis = {
    cancel: vi.fn(),
    resume: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn(),
  }
  ;(window as unknown as { speechSynthesis?: unknown }).speechSynthesis = synthesis
  ;(window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance = class {
    text: string
    lang = ''
    rate = 1
    voice: SpeechSynthesisVoice | null = null
    constructor(text?: string) {
      this.text = text ?? ''
    }
  }
  return synthesis
}

beforeEach(() => {
  // jsdom 不提供语音 API；delete 保证 `'speechSynthesis' in window` 为 false
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis
  delete (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance
  captured = undefined
})

describe('useEnglishSpeech', () => {
  it('reports unavailable without speechSynthesis and no-ops on speak', () => {
    mount(Host)
    expect(captured!.available.value).toBe(false)
    expect(() => captured!.speak('hello')).not.toThrow()
  })

  it('prefers a local en-US voice and defers speak after cancel', () => {
    vi.useFakeTimers()
    const synthesis = mockSynthesis([
      makeVoice('zh-CN', true, 'Xiaoxiao'),
      makeVoice('en-GB', false, 'Ryan Online'),
      makeVoice('en-US', true, 'Zira'),
    ])

    mount(Host)
    expect(captured!.available.value).toBe(true)

    captured!.speak('hello')
    // Chrome 在 cancel 后同一帧 speak 会吞掉语音，必须延迟
    expect(synthesis.speak).not.toHaveBeenCalled()
    vi.advanceTimersByTime(120)

    expect(synthesis.cancel).toHaveBeenCalled()
    expect(synthesis.resume).toHaveBeenCalled()
    expect(synthesis.speak).toHaveBeenCalledTimes(1)
    const utterance = synthesis.speak.mock.calls[0]![0] as UtteranceStub
    expect(utterance.text).toBe('hello')
    expect(utterance.lang).toBe('en-US')
    expect(utterance.voice?.name).toBe('Zira')
    vi.useRealTimers()
  })

  it('falls back to any english voice when no local one exists', () => {
    vi.useFakeTimers()
    const synthesis = mockSynthesis([
      makeVoice('zh-CN', true, 'Xiaoxiao'),
      makeVoice('en-GB', false, 'Ryan Online'),
    ])
    mount(Host)
    captured!.speak('hello')
    vi.advanceTimersByTime(120)
    const utterance = synthesis.speak.mock.calls[0]![0] as UtteranceStub
    expect(utterance.voice?.name).toBe('Ryan Online')
    vi.useRealTimers()
  })

  it('keeps the en-US lang hint when only non-english voices exist', () => {
    vi.useFakeTimers()
    const synthesis = mockSynthesis([makeVoice('zh-CN', true, 'Xiaoxiao')])
    mount(Host)
    captured!.speak('hello')
    vi.advanceTimersByTime(120)
    const utterance = synthesis.speak.mock.calls[0]![0] as UtteranceStub
    expect(utterance.voice).toBeNull()
    expect(utterance.lang).toBe('en-US')
    vi.useRealTimers()
  })
})
