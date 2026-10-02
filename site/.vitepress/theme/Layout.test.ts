import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

const layoutState = vi.hoisted(() => ({
  frontmatter: {} as Record<string, unknown>,
  page: { isNotFound: true },
}))

vi.mock('vitepress', async () => {
  const { defineComponent, ref } = await vi.importActual<typeof import('vue')>('vue')
  const frontmatter = ref(layoutState.frontmatter)
  const page = ref(layoutState.page)
  const isDark = ref(false)

  return {
    Content: defineComponent({ template: '<div>Markdown content</div>' }),
    useData: () => ({ frontmatter, page, isDark }),
    withBase: (path: string) => `/personal-site${path}`,
  }
})

vi.mock('./components/HomePage.vue', async () => {
  const { defineComponent } = await vi.importActual<typeof import('vue')>('vue')
  return { default: defineComponent({ template: '<div data-page="home">Home</div>' }) }
})

vi.mock('./components/ContentList.vue', async () => {
  const { defineComponent } = await vi.importActual<typeof import('vue')>('vue')
  return { default: defineComponent({ props: ['kind'], template: '<div :data-list="kind">List</div>' }) }
})

import Layout from './Layout.vue'

enableAutoUnmount(afterEach)

describe('Layout', () => {
  beforeEach(() => {
    layoutState.page.isNotFound = false
    layoutState.frontmatter.layout = undefined
  })

  it('renders the custom not-found view from VitePress page data', () => {
    layoutState.page.isNotFound = true
    const wrapper = mount(Layout, { global: { stubs: { Content: { template: '<div>Markdown content</div>' } } } })

    expect(wrapper.get('h1').text()).toBe('这个页面不存在')
    expect(wrapper.get('.not-found a[href="/personal-site/"]').text()).toBe('返回首页')
  })

  it.each(['projects', 'posts'] as const)('dispatches %s index pages to ContentList', (kind) => {
    layoutState.frontmatter.layout = kind

    const wrapper = mount(Layout, { global: { stubs: { Content: { template: '<div>Markdown content</div>' } } } })

    expect(wrapper.get(`[data-list="${kind}"]`).exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Markdown content')
  })
})
