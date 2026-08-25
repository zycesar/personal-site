import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

import HomePage from './HomePage.vue'
import NotFound from './NotFound.vue'

enableAutoUnmount(afterEach)

describe('HomePage', () => {
  it('renders the portfolio sections and clearly labels example content', () => {
    const wrapper = mount(HomePage)

    expect(wrapper.get('h1').text()).toContain('好用的体验')
    const headings = wrapper.findAll('h2').map((heading) => heading.text())
    expect(headings).toContain('精选项目')
    expect(headings).toContain('最新文章')
    expect(headings).toContain('成长路径')
    expect(wrapper.findAll('[data-example="project"]').filter((label) => label.isVisible())).toHaveLength(2)
    expect(wrapper.findAll('[data-example="post"]').filter((label) => label.isVisible())).toHaveLength(3)
    expect(wrapper.get('img[alt="永字品牌图形"]')).toBeTruthy()
  })

  it('does not render contact content when no profile links are configured', () => {
    const wrapper = mount(HomePage)

    expect(wrapper.text()).not.toContain('一起聊聊')
  })
})

describe('NotFound', () => {
  it('offers a route back to the homepage', () => {
    const wrapper = mount(NotFound)

    expect(wrapper.get('h1').text()).toBe('这个页面不存在')
    expect(wrapper.get('a').text()).toBe('返回首页')
    expect(wrapper.get('a').attributes('href')).toBe('/')
  })
})
