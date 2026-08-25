import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'

const mockedProjects = vi.hoisted(() => [
  {
    url: '/projects/alpha',
    frontmatter: {
      title: '项目甲',
      description: '项目甲描述',
      date: '2026-08-25',
      tags: ['Vue', 'TypeScript'],
      draft: false,
      featured: true,
      example: true,
      exampleLabel: '示例项目',
    },
  },
])

const mockedPosts = vi.hoisted(() => [
  {
    url: '/posts/alpha',
    frontmatter: {
      title: '文章甲',
      description: '文章甲描述',
      date: '2026-08-24',
      tags: ['工程思维'],
      category: '前端工程',
      draft: false,
    },
  },
])

const mockedFrontmatter = vi.hoisted(() => ({
  title: '来自 Frontmatter 的标题',
  description: '来自 Frontmatter 的简介。',
}))

const projectFixtures = mockedProjects.map((project) => ({
  ...project,
  frontmatter: { ...project.frontmatter, tags: [...project.frontmatter.tags] },
}))
const postFixtures = mockedPosts.map((post) => ({
  ...post,
  frontmatter: { ...post.frontmatter, tags: [...post.frontmatter.tags] },
}))

vi.mock('../../../projects/projects.data', () => ({ data: mockedProjects }))
vi.mock('../../../posts/posts.data', () => ({ data: mockedPosts }))
vi.mock('vitepress', async () => {
  const { ref } = await vi.importActual<typeof import('vue')>('vue')
  const frontmatter = ref(mockedFrontmatter)

  return { useData: () => ({ frontmatter }) }
})

import ContentList from './ContentList.vue'

enableAutoUnmount(afterEach)

beforeEach(() => {
  mockedProjects.splice(0, mockedProjects.length, ...projectFixtures)
  mockedPosts.splice(0, mockedPosts.length, ...postFixtures)
  mockedFrontmatter.title = '来自 Frontmatter 的标题'
  mockedFrontmatter.description = '来自 Frontmatter 的简介。'
})

describe('ContentList', () => {
  it('renders project metadata as semantic linked cards', () => {
    const wrapper = mount(ContentList, { props: { kind: 'projects' } })

    expect(wrapper.get('h1').text()).toBe('来自 Frontmatter 的标题')
    expect(wrapper.get('.content-list-intro').text()).toBe('来自 Frontmatter 的简介。')

    const card = wrapper.get('a.content-card')
    expect(card.attributes('href')).toBe('/projects/alpha')
    expect(card.get('h2').text()).toBe('项目甲')
    expect(card.find('h3').exists()).toBe(false)
    expect(card.text()).toContain('项目甲描述')
    expect(card.get('time').attributes('datetime')).toBe('2026-08-25')
    expect(card.get('time').text()).toBe('2026年8月25日')
    expect(card.get('ul').attributes('aria-label')).toBe('标签')
    expect(card.findAll('li').map((tag) => tag.text())).toEqual(['Vue', 'TypeScript'])
    expect(card.get('[data-example]').text()).toBe('示例项目')
  })

  it('renders posts without an example label', () => {
    mockedFrontmatter.title = '文章页 Frontmatter 标题'
    mockedFrontmatter.description = '文章页 Frontmatter 简介。'

    const wrapper = mount(ContentList, { props: { kind: 'posts' } })

    expect(wrapper.get('h1').text()).toBe('文章页 Frontmatter 标题')
    expect(wrapper.get('.content-list-intro').text()).toBe('文章页 Frontmatter 简介。')
    expect(wrapper.get('a.content-card').attributes('href')).toBe('/posts/alpha')
    expect(wrapper.get('a.content-card h2').text()).toBe('文章甲')
    expect(wrapper.find('a.content-card h3').exists()).toBe(false)
    expect(wrapper.find('[data-example]').exists()).toBe(false)
  })

  it('renders an empty-state message when the selected data source is empty', () => {
    mockedProjects.splice(0)

    const wrapper = mount(ContentList, { props: { kind: 'projects' } })

    expect(wrapper.text()).toContain('内容正在准备中。')
    expect(wrapper.find('.content-card').exists()).toBe(false)
  })
})
