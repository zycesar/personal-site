import { describe, expect, it } from 'vitest'

import {
  buildFeedItems,
  normalizeSiteUrl,
  pagePathFromRelativePath,
} from '../../../scripts/generate-feed'
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

  it('rejects unknown post metadata keys', () => {
    expect(() =>
      parsePost({
        title: '文章',
        description: '摘要',
        date: '2026-08-25',
        category: 'Vue',
        tags: [],
        draft: false,
        typo: 'silently accepted',
      }),
    ).toThrow()
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

  it('accepts example projects with a visible example marker', () => {
    expect(
      parseProject({
        title: '案例',
        description: '摘要',
        date: '2026-08-25',
        tags: ['Vue'],
        example: true,
        exampleLabel: '查看示例',
      }),
    ).toMatchObject({ example: true, exampleLabel: '查看示例' })
  })

  it('accepts non-example projects without a visible example marker', () => {
    expect(
      parseProject({
        title: '案例',
        description: '摘要',
        date: '2026-08-25',
        tags: ['Vue'],
        example: false,
      }),
    ).toMatchObject({ example: false })
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

describe('RSS feed items', () => {
  it('excludes drafts and returns newest posts first with absolute metadata', () => {
    const posts = [
      {
        url: '/posts/old-post',
        frontmatter: {
          title: '旧文章',
          description: '旧文章摘要',
          date: '2026-01-02',
          category: '工程',
          tags: ['TypeScript'],
          draft: false,
        },
      },
      {
        url: '/posts/draft-post',
        frontmatter: {
          title: '草稿文章',
          description: '草稿摘要',
          date: '2026-12-31',
          category: '随笔',
          tags: [],
          draft: true,
        },
      },
      {
        url: '/posts/new-post',
        frontmatter: {
          title: '新文章',
          description: '新文章摘要',
          date: '2026-08-25',
          category: '前端',
          tags: ['Vue'],
          draft: false,
        },
      },
    ]

    const items = buildFeedItems(posts, 'https://example.com/')

    expect(items).toHaveLength(2)
    expect(items.map(({ title }) => title)).toEqual(['新文章', '旧文章'])
    expect(items[0]).toMatchObject({
      title: '新文章',
      description: '新文章摘要',
      link: 'https://example.com/posts/new-post',
    })
    expect(items[0].date).toBeInstanceOf(Date)
    expect(items[0].date.toISOString()).toBe('2026-08-25T00:00:00.000Z')
  })

  it('reports an explicit error for an invalid site URL', () => {
    expect(() => buildFeedItems([], 'not-an-absolute-url')).toThrow(/站点 URL/)
  })

  it.each([
    'https://user@example.com/',
    'https://example.com/base/',
    'https://example.com/?tenant=one',
    'https://example.com/#fragment',
  ])('rejects a site URL that is not a clean origin: %s', (siteUrl) => {
    expect(() => normalizeSiteUrl(siteUrl)).toThrow(/站点 URL.*根地址/)
  })

  it('reports the post URL when a date is invalid', () => {
    expect(() =>
      buildFeedItems([
        {
          url: '/posts/bad-date',
          frontmatter: {
            title: '日期错误',
            description: '日期错误摘要',
            date: 'not-a-date',
            category: '工程',
            tags: [],
            draft: false,
          },
        },
      ], 'https://example.com'),
    ).toThrow(/\/posts\/bad-date.*日期/)
  })
})

describe('canonical page paths', () => {
  it.each([
    ['index.md', '/'],
    ['posts/index.md', '/posts/'],
    ['posts/hello-world.md', '/posts/hello-world'],
  ])('maps %s to %s', (relativePath, expected) => {
    expect(pagePathFromRelativePath(relativePath)).toBe(expected)
  })
})
