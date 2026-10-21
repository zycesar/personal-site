import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import { termsByTrack } from '../../../english/catalog'
import TermList from './TermList.vue'
import { ENGLISH_PROGRESS_KEY } from './useEnglishProgress'

enableAutoUnmount(afterEach)

beforeEach(() => {
  window.localStorage.clear()
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis
  delete (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance
})

function trackButtons(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('button.term-track')
}

function filterButton(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper.findAll('button.term-filter').find((item) => item.text() === label)
  if (!button) throw new Error(`找不到筛选按钮：${label}`)
  return button
}

describe('TermList', () => {
  it('shows the fullstack track by default and hides the agent track', () => {
    const wrapper = mount(TermList)
    expect(wrapper.findAll('.term-card')).toHaveLength(132)
    expect(wrapper.text()).toContain('frontend')
    expect(wrapper.text()).not.toContain('vector database')
  })

  it('switches to the agent track on demand', async () => {
    const wrapper = mount(TermList)
    await trackButtons(wrapper)[1]!.trigger('click')

    expect(wrapper.findAll('.term-card')).toHaveLength(61)
    expect(wrapper.text()).toContain('vector database')
    expect(wrapper.text()).not.toContain('frontend')
    expect(trackButtons(wrapper)[1]!.attributes('aria-pressed')).toBe('true')
    expect(trackButtons(wrapper)[0]!.attributes('aria-pressed')).toBe('false')
  })

  it('narrows the list down to a single category', async () => {
    const wrapper = mount(TermList)
    await filterButton(wrapper, '前端').trigger('click')

    const cards = wrapper.findAll('.term-card')
    expect(cards).toHaveLength(16)
    for (const card of cards) expect(card.get('.term-card-category').text()).toBe('前端')
  })

  it('returns to the whole track when 全部 is selected', async () => {
    const wrapper = mount(TermList)
    await filterButton(wrapper, '前端').trigger('click')
    await filterButton(wrapper, '全部').trigger('click')
    expect(wrapper.findAll('.term-card')).toHaveLength(132)
  })

  it('counts mastered terms and updates the progress bar', async () => {
    const wrapper = mount(TermList)
    const progressBar = wrapper.get('.term-progress-bar')
    expect(progressBar.attributes('role')).toBe('progressbar')
    expect(progressBar.attributes('aria-valuenow')).toBe('0')
    expect(progressBar.attributes('aria-valuemax')).toBe('132')
    expect(wrapper.get('.term-progress-count').text()).toContain('0 / 132')

    const firstCard = wrapper.get('.term-card')
    await firstCard.get('button.term-card-head').trigger('click')
    await firstCard.get('button.mark-button').trigger('click')

    expect(wrapper.get('.term-progress-count').text()).toContain('1 / 132')
    expect(wrapper.get('.term-progress-bar').attributes('aria-valuenow')).toBe('1')
  })

  it('hides mastered terms when 只看未掌握 is enabled', async () => {
    const wrapper = mount(TermList)
    const firstCard = wrapper.get('.term-card')
    const marked = firstCard.get('.term-card-term').text()
    await firstCard.get('button.term-card-head').trigger('click')
    await firstCard.get('button.mark-button').trigger('click')

    await wrapper.get('button.term-filter-toggle').trigger('click')

    expect(wrapper.findAll('.term-card')).toHaveLength(131)
    expect(wrapper.get('.term-card-term').text()).not.toBe(marked)
  })

  it('shows a friendly empty state when nothing is left to learn', async () => {
    window.localStorage.setItem(ENGLISH_PROGRESS_KEY, JSON.stringify({
      checkins: {},
      wordMarks: {},
      termMarks: Object.fromEntries(
        termsByTrack('fullstack').map((term) => [term.id, { level: 'known', at: '2026-10-20T00:00:00.000Z' }]),
      ),
      quizResults: {},
    }))

    const wrapper = mount(TermList)
    await wrapper.get('button.term-filter-toggle').trigger('click')

    expect(wrapper.findAll('.term-card')).toHaveLength(0)
    expect(wrapper.get('.term-empty').exists()).toBe(true)
  })
})
