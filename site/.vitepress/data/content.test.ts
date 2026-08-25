import { describe, expect, it } from 'vitest'

import { parsePost, parseProject, visibleByDate } from './content'

describe('content metadata', () => {
  it('rejects a post missing description', () => {
    expect(() =>
      parsePost({
        title: '文章',
        date: '2026-08-25',
        category: 'Vue',
        tags: [],
        draft: false,
      }),
    ).toThrow(/description/)
  })

  it('requires a visible example marker for example projects', () => {
    expect(() =>
      parseProject({
        title: '案例',
        description: '摘要',
        date: '2026-08-25',
        tags: ['Vue'],
        featured: true,
        draft: false,
        example: true,
      }),
    ).toThrow(/exampleLabel/)
  })

  it('filters drafts and sorts newest content first', () => {
    const pages = [
      { url: '/old', frontmatter: { date: '2026-01-01', draft: false } },
      { url: '/draft', frontmatter: { date: '2026-12-01', draft: true } },
      { url: '/new', frontmatter: { date: '2026-08-25', draft: false } },
    ]

    expect(visibleByDate(pages).map(({ url }) => url)).toEqual(['/new', '/old'])
  })
})
