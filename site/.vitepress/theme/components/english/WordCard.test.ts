import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import type { WordEntry } from '../../../english/schema'
import WordCard from './WordCard.vue'
import { ENGLISH_PROGRESS_KEY } from './useEnglishProgress'

vi.mock('vitepress', () => ({ withBase: (path: string) => `/personal-site${path}` }))

enableAutoUnmount(afterEach)

const word: WordEntry = {
  id: 'w-001',
  word: 'abandon',
  phonetic: '/əˈbændən/',
  definitions: [{ pos: 'v.', meaning: '放弃；抛弃' }, { pos: 'n.', meaning: '放纵' }],
  exampleEn: 'He refused to abandon his plan.',
  exampleZh: '他拒绝放弃计划。',
  tags: ['动词'],
}

beforeEach(() => {
  window.localStorage.clear()
  // jsdom 不提供 speechSynthesis；delete（而非赋 undefined）保证 `'speechSynthesis' in window` 为 false
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis
  delete (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance
})

describe('WordCard', () => {
  it('renders the word, phonetic, definitions, and example', () => {
    const wrapper = mount(WordCard, { props: { word } })
    expect(wrapper.get('h3').text()).toContain('abandon')
    expect(wrapper.text()).toContain('/əˈbændən/')
    expect(wrapper.text()).toContain('v. 放弃；抛弃')
    expect(wrapper.text()).toContain('n. 放纵')
    expect(wrapper.text()).toContain('He refused to abandon his plan.')
    expect(wrapper.text()).toContain('他拒绝放弃计划。')
  })

  it('hides speech and mark controls in read-only mode', () => {
    const wrapper = mount(WordCard, { props: { word, readOnly: true } })
    expect(wrapper.find('button[aria-label="播放单词发音"]').exists()).toBe(false)
    expect(wrapper.findAll('button').length).toBe(0)
  })

  it('shows the speech button after mount when speechSynthesis exists', async () => {
    window.speechSynthesis = {
      cancel: vi.fn(),
      resume: vi.fn(),
      speak: vi.fn(),
      getVoices: vi.fn(() => []),
      addEventListener: vi.fn(),
    } as unknown as SpeechSynthesis
    ;(window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance =
      class { constructor(public text?: string) {} }
    vi.useFakeTimers()
    const wrapper = mount(WordCard, { props: { word } })
    await wrapper.vm.$nextTick()
    const button = wrapper.get('button[aria-label="播放单词发音"]')
    await button.trigger('click')
    vi.advanceTimersByTime(120)
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('persists the latest familiar-level mark', async () => {
    const wrapper = mount(WordCard, { props: { word } })
    const buttons = wrapper.findAll('button.mark-button')
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')

    const stored = JSON.parse(window.localStorage.getItem(ENGLISH_PROGRESS_KEY)!)
    expect(stored.wordMarks['w-001'].level).toBe('fuzzy')
    expect(buttons[1]!.attributes('aria-pressed')).toBe('true')
  })
})
