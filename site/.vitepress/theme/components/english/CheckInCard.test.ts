import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import CheckInCard from './CheckInCard.vue'
import { ENGLISH_PROGRESS_KEY } from './useEnglishProgress'

vi.mock('vitepress', () => ({ withBase: (path: string) => `/personal-site${path}` }))

enableAutoUnmount(afterEach)

const today = '2026-10-12'

beforeEach(() => {
  window.localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 12, 9, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CheckInCard', () => {
  it('starts unchecked and checks in on click', async () => {
    const wrapper = mount(CheckInCard, { props: { dateIso: today } })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('button[aria-label="今日打卡"]').text()).toContain('打卡')
    expect(wrapper.get('button[aria-label="今日打卡"]').text()).not.toContain('已打卡')
    expect(wrapper.text()).not.toContain('已连续打卡')

    await wrapper.get('button[aria-label="今日打卡"]').trigger('click')
    expect(wrapper.get('button[aria-label="今日打卡"]').text()).toContain('已打卡')
    expect(wrapper.get('button[aria-label="今日打卡"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('已连续打卡 1 天')
    expect(JSON.parse(window.localStorage.getItem(ENGLISH_PROGRESS_KEY)!).checkins[today]).toBe(true)
  })

  it('remains checked in after reload and shows the stored streak', async () => {
    window.localStorage.setItem(ENGLISH_PROGRESS_KEY, JSON.stringify({
      checkins: { '2026-10-10': true, '2026-10-11': true, '2026-10-12': true },
      wordMarks: {},
      quizResults: {},
    }))
    const wrapper = mount(CheckInCard, { props: { dateIso: today } })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('button[aria-label="今日打卡"]').text()).toContain('已打卡')
    expect(wrapper.text()).toContain('已连续打卡 3 天')
  })
})
