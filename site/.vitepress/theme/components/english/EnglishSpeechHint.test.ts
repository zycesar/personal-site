import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import EnglishSpeechHint from './EnglishSpeechHint.vue'
import { speechErrorText } from './useEnglishSpeech'

enableAutoUnmount(afterEach)

function makeVoice(lang: string, localService: boolean, name: string): SpeechSynthesisVoice {
  return { lang, localService, name, default: false, voiceURI: name } as unknown as SpeechSynthesisVoice
}

function mockSynthesis(voices: SpeechSynthesisVoice[]) {
  ;(window as unknown as { speechSynthesis?: unknown }).speechSynthesis = {
    cancel: vi.fn(),
    resume: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn(),
  }
}

beforeEach(() => {
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis
  speechErrorText.value = ''
})

describe('EnglishSpeechHint', () => {
  it('stays silent when the browser has no speech synthesis', () => {
    const wrapper = mount(EnglishSpeechHint)
    expect(wrapper.find('.speech-hint').exists()).toBe(false)
  })

  it('explains how to get a proper accent when the system has no english voice', async () => {
    mockSynthesis([makeVoice('zh-CN', true, 'Xiaoxiao')])
    const wrapper = mount(EnglishSpeechHint)
    await nextTick()
    expect(wrapper.get('.speech-hint').text()).toContain('没有检测到英文语音包')
    expect(wrapper.get('.speech-hint').text()).toContain('语言选项 → 语音')
  })

  it('stays silent when an english voice is available', async () => {
    mockSynthesis([makeVoice('en-US', true, 'Zira')])
    const wrapper = mount(EnglishSpeechHint)
    await nextTick()
    expect(wrapper.find('.speech-hint').exists()).toBe(false)
  })

  it('surfaces the synthesis error', async () => {
    mockSynthesis([makeVoice('en-US', true, 'Zira')])
    speechErrorText.value = '系统没有安装英文语音包'
    const wrapper = mount(EnglishSpeechHint)
    await nextTick()
    expect(wrapper.get('.speech-hint.is-error').text()).toContain('系统没有安装英文语音包')
  })
})
