import { afterEach, describe, expect, it, vi } from 'vitest'
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

vi.mock('../../../projects/projects.data', () => ({ data: mockedProjects }))
vi.mock('../../../posts/posts.data', () => ({ data: mockedPosts }))

import ContentList from './ContentList.vue'

enableAutoUnmount(afterEach)

describe('ContentList', () => {
  it('renders project metadata as semantic linked cards', () => {
    const wrapper = mount(ContentList, { props: { kind: 'projects' } })

    expect(wrapper.get('h1').text()).toBe('项目')
    expect(wrapper.get('.content-list-intro').text()).toBe('项目案例与实践记录。')

    const card = wrapper.get('a.content-card')
    expect(card.attributes('href')).toBe('/projects/alpha')
    expect(card.get('h3').text()).toBe('项目甲')
    expect(card.text()).toContain('项目甲描述')
    expect(card.get('time').attributes('datetime')).toBe('2026-08-25')
    expect(card.get('time').text()).toBe('2026年8月25日')
    expect(card.get('ul').attributes('aria-label')).toBe('标签')
    expect(card.findAll('li').map((tag) => tag.text())).toEqual(['Vue', 'TypeScript'])
    expect(card.get('[data-example]').text()).toBe('示例项目')
  })

  it('renders posts without an example label', () => {
    const wrapper = mount(ContentList, { props: { kind: 'posts' } })

    expect(wrapper.get('h1').text()).toBe('文章')
    expect(wrapper.get('.content-list-intro').text()).toBe('前端、工程化与全栈学习记录。')
    expect(wrapper.get('a.content-card').attributes('href')).toBe('/posts/alpha')
    expect(wrapper.find('[data-example]').exists()).toBe(false)
  })

  it('renders an empty-state message when the selected data source is empty', () => {
    mockedProjects.splice(0)

    const wrapper = mount(ContentList, { props: { kind: 'projects' } })

    expect(wrapper.text()).toContain('内容正在准备中。')
    expect(wrapper.find('.content-card').exists()).toBe(false)
  })
})
