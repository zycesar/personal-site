import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import SiteHeader from './SiteHeader.vue'
import ThemeToggle from './ThemeToggle.vue'

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

afterEach(() => {
  document.documentElement.className = ''
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('SiteHeader', () => {
  it('renders the primary navigation and opens its menu', async () => {
    const wrapper = mount(SiteHeader)
    const navigation = wrapper.get('nav[aria-label="主导航"]')

    expect(navigation.text()).toContain('项目')
    expect(navigation.text()).toContain('文章')
    expect(navigation.text()).toContain('关于')

    await wrapper.get('button[aria-label="打开导航菜单"]').trigger('click')

    expect(navigation.attributes('data-open')).toBe('true')
  })
})

describe('ThemeToggle', () => {
  it('uses the dark system preference and persists a light selection', async () => {
    stubMatchMedia(true)

    const wrapper = mount(ThemeToggle)
    await nextTick()
    const button = wrapper.get('button')

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(button.attributes('aria-label')).toBe('切换到浅色模式')

    await button.trigger('click')

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(button.attributes('aria-label')).toBe('切换到深色模式')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('lets a saved light preference override the dark system preference', () => {
    localStorage.setItem('theme', 'light')
    stubMatchMedia(true)

    const wrapper = mount(ThemeToggle)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(wrapper.get('button').attributes('aria-label')).toBe('切换到深色模式')
  })
})
