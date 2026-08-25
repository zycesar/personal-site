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

const mockedProjects = vi.hoisted(() => [
  { url: '/projects/first', frontmatter: { title: '精选项目一', description: '项目一描述', date: '2026-08-25', tags: ['Vue'], featured: true, draft: false, example: true, exampleLabel: '项目样例一' } },
  { url: '/projects/second', frontmatter: { title: '精选项目二', description: '项目二描述', date: '2026-08-24', tags: ['TypeScript'], featured: true, draft: false, example: true, exampleLabel: '项目样例二' } },
  { url: '/projects/unfeatured', frontmatter: { title: '非精选项目', description: '不应出现', date: '2026-08-26', tags: ['Node.js'], featured: false, draft: false, example: false } },
])

const mockedPosts = vi.hoisted(() => [
  { url: '/posts/newest', frontmatter: { title: '最新文章', description: '最新描述', date: '2026-08-25', tags: ['一'], category: '测试', draft: false } },
  { url: '/posts/second', frontmatter: { title: '第二篇文章', description: '第二篇描述', date: '2026-08-24', tags: ['二'], category: '测试', draft: false } },
  { url: '/posts/third', frontmatter: { title: '第三篇文章', description: '第三篇描述', date: '2026-08-23', tags: ['三'], category: '测试', draft: false } },
  { url: '/posts/fourth', frontmatter: { title: '第四篇文章', description: '不应出现', date: '2026-08-22', tags: ['四'], category: '测试', draft: false } },
])

vi.mock('../../../data/profile', () => ({ profile: mockedProfile }))
vi.mock('../../../projects/projects.data', () => ({ data: mockedProjects }))
vi.mock('../../../posts/posts.data', () => ({ data: mockedPosts }))
vi.mock('vitepress', () => ({ withBase: (path: string) => `/personal-site${path}` }))

import HomePage from './HomePage.vue'
import NotFound from './NotFound.vue'

enableAutoUnmount(afterEach)

beforeEach(() => {
  mockedProfile.links.length = 0
})

describe('HomePage', () => {
  it('renders loader-derived featured projects and the three newest posts in order', () => {
    const wrapper = mount(HomePage)

    expect(wrapper.get('.hero .eyebrow').text()).toBe('HELLO，我是测试姓名')
    expect(wrapper.get('h1').text().replace(/\s+/g, ' ').trim()).toBe('我为 Web 构建 好用的体验。')
    const headings = wrapper.findAll('h2').map((heading) => heading.text())
    expect(headings).toEqual(['精选项目', '最新文章', '不只展示结果，也记录成长过程。'])
    expect(wrapper.get('.journey .eyebrow').text()).toBe('成长路径')
    expect(wrapper.get('img[alt="永字品牌图形"]').attributes('src')).toBe('/personal-site/brand.svg')

    const projectCards = wrapper.findAll('.project-card')
    expect(projectCards.map((card) => card.get('h3').text())).toEqual(['精选项目一', '精选项目二'])
    expect(projectCards.map((card) => card.attributes('href'))).toEqual(['/personal-site/projects/first', '/personal-site/projects/second'])
    expect(projectCards.map((card) => card.get('[data-example]').text())).toEqual(['项目样例一', '项目样例二'])

    const postCards = wrapper.findAll('.post-card')
    expect(postCards.map((card) => card.get('h3').text())).toEqual(['最新文章', '第二篇文章', '第三篇文章'])
    expect(postCards.map((card) => card.attributes('href'))).toEqual(['/personal-site/posts/newest', '/personal-site/posts/second', '/personal-site/posts/third'])
    expect(wrapper.text()).not.toContain('非精选项目')
    expect(wrapper.text()).not.toContain('第四篇文章')
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
    expect(wrapper.get('a').attributes('href')).toBe('/personal-site/')
  })
})
