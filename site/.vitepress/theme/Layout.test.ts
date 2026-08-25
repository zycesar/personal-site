import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

vi.mock('vitepress', async () => {
  const { defineComponent, ref } = await vi.importActual<typeof import('vue')>('vue')
  const frontmatter = ref<Record<string, unknown>>({})
  const page = ref({ isNotFound: true })
  const isDark = ref(false)

  return {
    Content: defineComponent({ template: '<div>Markdown content</div>' }),
    useData: () => ({ frontmatter, page, isDark }),
  }
})

import Layout from './Layout.vue'

enableAutoUnmount(afterEach)

describe('Layout', () => {
  it('renders the custom not-found view from VitePress page data', () => {
    const wrapper = mount(Layout)

    expect(wrapper.get('h1').text()).toBe('这个页面不存在')
    expect(wrapper.get('.not-found a[href="/"]').text()).toBe('返回首页')
  })
})
