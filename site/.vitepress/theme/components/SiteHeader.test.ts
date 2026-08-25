import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount, renderToString } from '@vue/test-utils'
import { nextTick, type Ref } from 'vue'

import SiteHeader from './SiteHeader.vue'
import ThemeToggle from './ThemeToggle.vue'

vi.mock('vitepress', async () => {
  const { ref } = await vi.importActual<typeof import('vue')>('vue')
  const mockedIsDark = ref(false)

  return {
    mockedIsDark,
    useData: () => ({ isDark: mockedIsDark }),
    withBase: (path: string) => `/personal-site${path}`,
  }
})

enableAutoUnmount(afterEach)

let appearance: Ref<boolean>

beforeEach(async () => {
  const vitepress = await import('vitepress') as typeof import('vitepress') & {
    mockedIsDark: Ref<boolean>
  }
  appearance = vitepress.mockedIsDark
  appearance.value = false
})

describe('SiteHeader', () => {
  it('renders the primary navigation and manages its expanded state', async () => {
    const wrapper = mount(SiteHeader)
    const navigation = wrapper.get('nav[aria-label="主导航"]')
    const menuButton = wrapper.get('button[aria-controls="primary-navigation"]')

    expect(navigation.text()).toContain('项目')
    expect(navigation.text()).toContain('文章')
    expect(navigation.text()).toContain('关于')
    expect(navigation.attributes('id')).toBe('primary-navigation')
    expect(navigation.attributes('data-open')).toBe('false')
    expect(menuButton.attributes('aria-expanded')).toBe('false')
    expect(menuButton.attributes('aria-label')).toBe('打开导航菜单')

    await menuButton.trigger('click')

    expect(navigation.attributes('data-open')).toBe('true')
    expect(menuButton.attributes('aria-expanded')).toBe('true')
    expect(menuButton.attributes('aria-label')).toBe('关闭导航菜单')

    expect(wrapper.get('a[aria-label="王永忠首页"]').attributes('href')).toBe('/personal-site/')
    const projectLink = wrapper.get('a[href="/personal-site/projects/"]')
    projectLink.element.addEventListener('click', (event) => event.preventDefault())
    await projectLink.trigger('click')

    expect(navigation.attributes('data-open')).toBe('false')
    expect(menuButton.attributes('aria-expanded')).toBe('false')
    expect(menuButton.attributes('aria-label')).toBe('打开导航菜单')
  })
})

describe('ThemeToggle', () => {
  it('renders invariant markup before hydration regardless of appearance', async () => {
    appearance.value = false
    const lightHtml = await renderToString(ThemeToggle)

    appearance.value = true
    const darkHtml = await renderToString(ThemeToggle)

    expect(lightHtml).toBe(darkHtml)
    expect(darkHtml).toContain('aria-label="切换颜色模式"')
    expect(darkHtml).toContain('<span aria-hidden="true">◐</span>')
  })

  it('toggles the VitePress appearance state', async () => {
    const wrapper = mount(ThemeToggle)
    const button = wrapper.get('button')
    await nextTick()

    expect(button.attributes('aria-label')).toBe('切换到深色模式')

    await button.trigger('click')

    expect(appearance.value).toBe(true)
    expect(button.attributes('aria-label')).toBe('切换到浅色模式')
  })

  it('reacts to external VitePress appearance changes', async () => {
    const wrapper = mount(ThemeToggle)
    const button = wrapper.get('button')
    await nextTick()

    expect(button.attributes('aria-label')).toBe('切换到深色模式')

    appearance.value = true
    await nextTick()

    expect(button.attributes('aria-label')).toBe('切换到浅色模式')
  })
})
