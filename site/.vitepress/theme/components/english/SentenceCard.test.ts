import { afterEach, describe, expect, it, vi } from 'vitest'
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
})
