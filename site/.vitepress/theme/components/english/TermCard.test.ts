import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import type { TermEntry } from '../../../english/schema'
import TermCard from './TermCard.vue'

enableAutoUnmount(afterEach)

const term: TermEntry = {
  id: 't-001',
  term: 'frontend',
  phonetic: '/ˈfrʌnt,end/',
  meaning: '用户界面部分',
  category: '前端',
  track: 'fullstack',
  exampleEn: 'The frontend calls the API and renders the result.',
  exampleZh: '前端调用接口并渲染结果。',
  tags: [],
}

beforeEach(() => {
  window.localStorage.clear()
  // jsdom 不提供 speechSynthesis；delete（而非赋 undefined）保证 `'speechSynthesis' in window` 为 false
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis
  delete (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance
})

describe('TermCard', () => {
  it('renders the term, phonetic, meaning and category', () => {
    const wrapper = mount(TermCard, { props: { term } })
    expect(wrapper.get('.term-card-term').text()).toContain('frontend')
    expect(wrapper.text()).toContain('/ˈfrʌnt,end/')
    expect(wrapper.text()).toContain('用户界面部分')
    expect(wrapper.get('.term-card-category').text()).toBe('前端')
  })

  it('keeps the panel collapsed until the header is clicked', async () => {
    const wrapper = mount(TermCard, { props: { term } })
    const head = wrapper.get('button.term-card-head')
    expect(head.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.term-card-example').exists()).toBe(false)

    await head.trigger('click')
    expect(head.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('.term-card-example').isVisible()).toBe(true)
    expect(wrapper.text()).toContain('The frontend calls the API and renders the result.')
    expect(wrapper.text()).toContain('前端调用接口并渲染结果。')
  })

  it('emits a mark event instead of writing progress itself', async () => {
    const wrapper = mount(TermCard, { props: { term } })
    await wrapper.get('button.term-card-head').trigger('click')
    const buttons = wrapper.findAll('button.mark-button')
    expect(buttons).toHaveLength(3)
    await buttons[0]!.trigger('click')
    expect(wrapper.emitted('mark')).toEqual([['known']])
  })

  it('shows the mastery badge for a known term and marks the pressed option', async () => {
    const wrapper = mount(TermCard, { props: { term, level: 'known' } })
    expect(wrapper.get('.term-card-badge').text()).toBe('已掌握')

    await wrapper.get('button.term-card-head').trigger('click')
    const pressed = wrapper.findAll('button.mark-button')
      .filter((button) => button.attributes('aria-pressed') === 'true')
    expect(pressed).toHaveLength(1)
    expect(pressed[0]!.text()).toBe('认识')
  })

  it('shows a muted badge for a fuzzy term', () => {
    const wrapper = mount(TermCard, { props: { term, level: 'fuzzy' } })
    expect(wrapper.get('.term-card-badge').text()).toBe('模糊')
    expect(wrapper.get('.term-card-badge').classes()).toContain('is-muted')
  })

  it('hides the mark controls in read-only mode but keeps the card expandable', async () => {
    const wrapper = mount(TermCard, { props: { term, readOnly: true } })
    expect(wrapper.findAll('button.mark-button')).toHaveLength(0)

    await wrapper.get('button.term-card-head').trigger('click')
    expect(wrapper.get('.term-card-example').isVisible()).toBe(true)
  })

  it('hides the speech buttons when the browser has no speech synthesis', async () => {
    const wrapper = mount(TermCard, { props: { term } })
    await wrapper.get('button.term-card-head').trigger('click')
    expect(wrapper.findAll('button.speak-button')).toHaveLength(0)
  })

  it('renders the speech buttons when speech synthesis is available', async () => {
    window.speechSynthesis = {
      cancel: vi.fn(),
      resume: vi.fn(),
      speak: vi.fn(),
      getVoices: vi.fn(() => []),
      addEventListener: vi.fn(),
    } as unknown as SpeechSynthesis
    ;(window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance = class {
      constructor(public text?: string) {}
    }

    const wrapper = mount(TermCard, { props: { term } })
    await wrapper.get('button.term-card-head').trigger('click')
    const buttons = wrapper.findAll('button.speak-button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]!.text()).toContain('听术语')
    expect(buttons[1]!.text()).toContain('听例句')
  })

  it('speaks the term with the sayAs override when provided', async () => {
    vi.useFakeTimers()
    const synthesis = {
      cancel: vi.fn(),
      resume: vi.fn(),
      speak: vi.fn(),
      getVoices: vi.fn(() => []),
      addEventListener: vi.fn(),
    }
    window.speechSynthesis = synthesis as unknown as SpeechSynthesis
    ;(window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance = class {
      text: string
      constructor(text?: string) { this.text = text ?? '' }
    }

    const wrapper = mount(TermCard, {
      props: { term: { ...term, id: 't-097', term: 'RAG', sayAs: 'R A G' } },
    })
    await wrapper.get('button.term-card-head').trigger('click')
    await wrapper.findAll('button.speak-button')[0]!.trigger('click')
    vi.advanceTimersByTime(120)

    const utterance = synthesis.speak.mock.calls[0]![0] as { text: string }
    expect(utterance.text).toBe('R A G')
    vi.useRealTimers()
  })
})
