import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

const mockedProfile = vi.hoisted(() => ({
  name: '测试姓名',
  mark: '永',
  role: '前端开发者',
  intro: '测试个人简介',
  journey: ['第一阶段', '第二阶段', '第三阶段'],
  links: [] as Array<{ label: string; href: string }>,
}))

vi.mock('../../../data/profile', () => ({ profile: mockedProfile }))

import HomePage from './HomePage.vue'
import NotFound from './NotFound.vue'

enableAutoUnmount(afterEach)

beforeEach(() => {
  mockedProfile.links.length = 0
})

describe('HomePage', () => {
  it('renders the portfolio sections and clearly labels example content', () => {
    const wrapper = mount(HomePage)

    expect(wrapper.get('.hero .eyebrow').text()).toBe('HELLO，我是测试姓名')
    expect(wrapper.get('h1').text().replace(/\s+/g, ' ').trim()).toBe('我为 Web 构建 好用的体验。')
    const headings = wrapper.findAll('h2').map((heading) => heading.text())
    expect(headings).toEqual(['精选项目', '最新文章', '不只展示结果，也记录成长过程。'])
    expect(wrapper.get('.journey .eyebrow').text()).toBe('成长路径')
    expect(wrapper.findAll('[data-example="project"]').filter((label) => label.isVisible())).toHaveLength(2)
    expect(wrapper.findAll('[data-example="post"]').filter((label) => label.isVisible())).toHaveLength(3)
    expect(wrapper.get('img[alt="永字品牌图形"]')).toBeTruthy()

    const projectCards = wrapper.findAll('.project-card')
    expect(projectCards[0].text()).toContain('展示项目案例写法的结构样例。')
    expect(projectCards[0].findAll('.tag-list li').map((tag) => tag.text())).toEqual(['Vue', 'TypeScript'])
    expect(projectCards[1].text()).toContain('记录前端向服务端延伸的学习路径。')
    expect(projectCards[1].findAll('.tag-list li').map((tag) => tag.text())).toEqual(['Node.js', 'Database'])
  })

  it('does not render contact content when no profile links are configured', () => {
    const wrapper = mount(HomePage)

    expect(wrapper.text()).not.toContain('一起聊聊')
  })

  it('renders the approved contact heading when profile links are configured', () => {
    mockedProfile.links.push({ label: '示例链接', href: 'https://example.com' })
    const wrapper = mount(HomePage)

    expect(wrapper.get('#contact-title').text()).toBe('一起聊聊。')
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
