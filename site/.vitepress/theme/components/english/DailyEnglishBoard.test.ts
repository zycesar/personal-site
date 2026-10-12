import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import { dailyPicks } from '../../../english/picks'
import DailyEnglishBoard from './DailyEnglishBoard.vue'

vi.mock('vitepress', () => ({ withBase: (path: string) => `/personal-site${path}` }))

enableAutoUnmount(afterEach)

beforeEach(() => {
  window.localStorage.clear()
})

describe('DailyEnglishBoard', () => {
  it('renders word, sentence, and quiz sections for the date', () => {
    const wrapper = mount(DailyEnglishBoard, { props: { dateIso: '2026-10-12' } })
    expect(wrapper.find('section[aria-label="每日英语"]').exists()).toBe(true)
    expect(wrapper.find('.word-card').exists()).toBe(true)
    expect(wrapper.find('.sentence-card').exists()).toBe(true)
    expect(wrapper.find('.quiz-card').exists()).toBe(true)
    expect(wrapper.find('.checkin-card').exists()).toBe(false)
    // 断言词卡内容与 picks 模块对同一日期的确定性结果一致，不硬编码具体单词
    expect(wrapper.find('.word-card').text()).toContain(dailyPicks('2026-10-12').word.word)
  })

  it('adds the check-in card in interactive mode', () => {
    const wrapper = mount(DailyEnglishBoard, { props: { dateIso: '2026-10-12', interactive: true } })
    expect(wrapper.find('.checkin-card').exists()).toBe(true)
  })
})
