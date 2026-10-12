import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import type { SentenceEntry } from '../../../english/schema'
import SentenceCard from './SentenceCard.vue'

vi.mock('vitepress', () => ({ withBase: (path: string) => `/personal-site${path}` }))

enableAutoUnmount(afterEach)

const sentence: SentenceEntry = {
  id: 's-001',
  en: 'Practice does not make perfect.',
  zh: '练习不能成就完美。',
  notes: ['practice 不可数。'],
  source: '佚名',
}

beforeEach(() => {
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis
  delete (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance
})

describe('SentenceCard', () => {
  it('renders the sentence, translation, notes, and source', () => {
    const wrapper = mount(SentenceCard, { props: { sentence } })
    expect(wrapper.text()).toContain('Practice does not make perfect.')
    expect(wrapper.text()).toContain('练习不能成就完美。')
    expect(wrapper.text()).toContain('practice 不可数。')
    expect(wrapper.text()).toContain('佚名')
  })

  it('omits the source line when absent', () => {
    const wrapper = mount(SentenceCard, { props: { sentence: { ...sentence, source: undefined } } })
    expect(wrapper.text()).not.toContain('佚名')
  })

  it('hides the speech button without speechSynthesis support', async () => {
    const wrapper = mount(SentenceCard, { props: { sentence } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button[aria-label="播放句子发音"]').exists()).toBe(false)
  })

  it('hides all controls in read-only mode', () => {
    const wrapper = mount(SentenceCard, { props: { sentence, readOnly: true } })
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('speaks the sentence text when speech is supported', async () => {
    const speak = vi.fn()
    window.speechSynthesis = {
      cancel: vi.fn(),
      resume: vi.fn(),
      speak,
      getVoices: vi.fn(() => []),
      addEventListener: vi.fn(),
    } as unknown as SpeechSynthesis
    ;(window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance =
      class { constructor(public text?: string) {} }
    vi.useFakeTimers()
    try {
      const wrapper = mount(SentenceCard, { props: { sentence } })
      await wrapper.vm.$nextTick()
      await wrapper.get('button[aria-label="播放句子发音"]').trigger('click')
      vi.advanceTimersByTime(120)
      expect(speak).toHaveBeenCalledTimes(1)
      const utterance = speak.mock.calls[0]![0] as { text?: string }
      expect(utterance.text).toBe('Practice does not make perfect.')
    } finally {
      vi.useRealTimers()
    }
  })
})
