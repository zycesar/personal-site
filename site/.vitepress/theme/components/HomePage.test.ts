import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

const mockedProfile = vi.hoisted(() => ({
  name: '测试姓名',
  mark: '永',
  role: '前端开发者',
  headline: '从业务问题出发，',
  emphasis: '构建可靠的应用。',
  intro: '测试个人简介',
  exploration: ['复杂业务的前端实践', '全栈业务交付', 'AI 应用与辅助开发'],
  links: [] as Array<{ label: string; href: string }>,
}))

const mockedProjects = vi.hoisted(() => [
  { url: '/projects/first', frontmatter: { title: '精选项目一', description: '项目一描述', date: '2026-08-25', tags: ['Vue'], featured: true, draft: false, example: true, exampleLabel: '项目样例一' } },
  { url: '/projects/second', frontmatter: { title: '精选项目二', description: '项目二描述', date: '2026-08-24', tags: ['TypeScript'], featured: true, draft: false, example: true, exampleLabel: '项目样例二' } },
  { url: '/projects/third', frontmatter: { title: '精选项目三', description: '项目三描述', date: '2026-08-23', tags: ['SSE'], featured: true, draft: false, example: false } },
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
    expect(wrapper.get('h1').text().replace(/\s+/g, ' ').trim()).toBe('从业务问题出发， 构建可靠的应用。')
    expect(wrapper.get('.hero-role').text()).toBe('前端开发者')
    expect(wrapper.findAll('.hero-actions a').map((link) => link.text())).toEqual(['阅读文章', '查看项目'])
    const headings = wrapper.findAll('h2').map((heading) => heading.text())
    expect(headings).toEqual(['精选项目', '最新文章', '在实践中积累，在探索中深入。'])
    expect(wrapper.get('.journey .eyebrow').text()).toBe('当前探索')
    expect(wrapper.findAll('.journey li strong').map((item) => item.text())).toEqual(mockedProfile.exploration)
    expect(wrapper.get('img[alt="永字品牌图形"]').attributes('src')).toBe('/personal-site/brand.svg')

    const projectCards = wrapper.findAll('.project-card')
    expect(projectCards.map((card) => card.get('h3').text())).toEqual(['精选项目一', '精选项目二', '精选项目三'])
    expect(projectCards.map((card) => card.attributes('href'))).toEqual(['/personal-site/projects/first', '/personal-site/projects/second', '/personal-site/projects/third'])
    expect(wrapper.findAll('.project-card [data-example]').map((label) => label.text())).toEqual(['项目样例一', '项目样例二'])

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

  it('does not show an empty latest-posts section before real articles are published', () => {
    const savedPosts = mockedPosts.splice(0)
    try {
      const wrapper = mount(HomePage)
      expect(wrapper.find('#posts-title').exists()).toBe(false)
      expect(wrapper.findAll('.post-card')).toHaveLength(0)
      expect(wrapper.findAll('.project-card')).toHaveLength(3)
    } finally {
      mockedPosts.push(...savedPosts)
    }
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
