import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import type { QuizEntry } from '../../../english/schema'
import QuizCard from './QuizCard.vue'
import { ENGLISH_PROGRESS_KEY } from './useEnglishProgress'

vi.mock('vitepress', () => ({ withBase: (path: string) => `/personal-site${path}` }))

enableAutoUnmount(afterEach)

const quiz: QuizEntry = {
  id: 'q-001',
  stem: 'The team refused to ______ the plan.',
  options: ['abandon', 'absorb', 'analyze', 'achieve'],
  answerIndex: 0,
  explanation: 'abandon 放弃。',
  tags: [],
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('QuizCard', () => {
  it('renders the stem and four labeled options', () => {
    const wrapper = mount(QuizCard, { props: { quiz } })
    expect(wrapper.text()).toContain('The team refused to ______ the plan.')
    expect(wrapper.findAll('button.quiz-option')).toHaveLength(4)
    expect(wrapper.text()).toContain('A. abandon')
  })

  it('grades a wrong pick, reveals the answer, and records the result', async () => {
    const wrapper = mount(QuizCard, { props: { quiz } })
    await wrapper.findAll('button.quiz-option')[2]!.trigger('click')

    expect(wrapper.get('.quiz-feedback').text()).toContain('回答错误')
    expect(wrapper.get('.quiz-feedback').text()).toContain('正确答案：A')
    expect(wrapper.get('.quiz-feedback').text()).toContain('abandon 放弃。')

    const stored = JSON.parse(window.localStorage.getItem(ENGLISH_PROGRESS_KEY)!)
    expect(stored.quizResults['q-001']).toMatchObject({ picked: 2, correct: false })

    await wrapper.findAll('button.quiz-option')[1]!.trigger('click')
    expect(JSON.parse(window.localStorage.getItem(ENGLISH_PROGRESS_KEY)!).quizResults['q-001'].picked).toBe(2)
  })

  it('grades a correct pick', async () => {
    const wrapper = mount(QuizCard, { props: { quiz } })
    await wrapper.findAll('button.quiz-option')[0]!.trigger('click')
    expect(wrapper.get('.quiz-feedback').text()).toContain('回答正确')
  })

  it('shows the answer and explanation without controls in read-only mode', () => {
    const wrapper = mount(QuizCard, { props: { quiz, readOnly: true } })
    expect(wrapper.get('.quiz-feedback').text()).toContain('正确答案')
    for (const button of wrapper.findAll('button.quiz-option')) {
      expect(button.attributes('disabled')).toBeDefined()
    }
  })
})
