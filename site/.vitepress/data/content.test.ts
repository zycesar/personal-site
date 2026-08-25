import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  buildFeedItems,
  normalizeSiteUrl,
  pagePathFromRelativePath,
} from '../../../scripts/generate-feed'
import {
  discoverDraftSourcePaths,
  draftSourcePaths,
  isDraftSitemapUrl,
} from '../../../scripts/discover-drafts'
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

  it.each([
    'http://localhost:5173',
    'http://localhost.',
    'http://127.0.0.1',
    'http://[::1]',
    'http://[::ffff:127.0.0.1]',
  ])('rejects a loopback production site URL: %s', (siteUrl) => {
    expect(() => normalizeSiteUrl(siteUrl)).toThrow(/站点 URL.*本地|loopback/i)
  })

  it('allows localhost only when explicitly enabled for development', () => {
    expect(normalizeSiteUrl('http://localhost:5173', { allowLoopback: true }))
      .toBe('http://localhost:5173/')
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

describe('draft source discovery', () => {
  it('returns only draft post and project detail source paths', () => {
    const pages = [
      {
        relativePath: 'posts/index.md',
        frontmatter: { title: '文章', description: '文章列表' },
      },
      {
        relativePath: 'posts/published.md',
        frontmatter: {
          title: '已发布文章', description: '摘要', date: '2026-08-25',
          category: '工程', tags: [], draft: false,
        },
      },
      {
        relativePath: 'posts/draft-post.md',
        frontmatter: {
          title: '草稿文章', description: '摘要', date: '2026-08-24',
          category: '工程', tags: [], draft: true,
        },
      },
      {
        relativePath: 'projects/draft-project.md',
        frontmatter: {
          title: '草稿项目', description: '摘要', date: '2026-08-23',
          tags: [], draft: true,
        },
      },
      {
        relativePath: 'posts/series/index.md',
        frontmatter: {
          title: '嵌套草稿', description: '摘要', date: '2026-08-22',
          category: '工程', tags: [], draft: true,
        },
      },
    ]

    expect(draftSourcePaths(pages)).toEqual([
      'posts/draft-post.md',
      'projects/draft-project.md',
      'posts/series/index.md',
    ])
  })

  it('reports the source path for invalid detail frontmatter', () => {
    expect(() => draftSourcePaths([{
      relativePath: 'posts/broken.md',
      frontmatter: {
        title: '损坏文章', date: '2026-08-25', category: '工程', tags: [], draft: true,
      },
    }])).toThrow(/posts\/broken\.md.*frontmatter/)
  })

  it.each([
    '/posts/draft-post',
    'posts/draft-post',
    'https://example.com/posts/draft-post',
  ])('recognizes draft sitemap URLs in relative or absolute form: %s', (url) => {
    expect(isDraftSitemapUrl(url, new Set(['/posts/draft-post']), 'https://example.com/'))
      .toBe(true)
  })

  it('recognizes a URL-encoded Unicode draft sitemap route', () => {
    expect(isDraftSitemapUrl(
      '/posts/%E8%8D%89%E7%A8%BF',
      new Set(['/posts/草稿']),
      'https://example.com/',
    )).toBe(true)
  })

  it('discovers drafts from Markdown files in a temporary site', async () => {
    const siteRoot = await mkdtemp(join(tmpdir(), 'draft-discovery-'))
    try {
      await mkdir(join(siteRoot, 'posts'))
      await mkdir(join(siteRoot, 'projects'))
      await mkdir(join(siteRoot, 'posts', 'series'))
      await writeFile(join(siteRoot, 'posts', 'index.md'), '---\ntitle: 文章\ndescription: 列表\n---\n')
      await writeFile(join(siteRoot, 'posts', 'published.md'), [
        '---', 'title: 已发布', 'description: 摘要', "date: '2026-08-25'",
        'category: 工程', 'tags: []', 'draft: false', '---', '',
      ].join('\n'))
      await writeFile(join(siteRoot, 'projects', 'draft.md'), [
        '---', 'title: 草稿项目', 'description: 摘要', "date: '2026-08-24'",
        'tags: []', 'draft: true', '---', '',
      ].join('\n'))
      await writeFile(join(siteRoot, 'posts', 'series', 'draft.md'), [
        '---', 'title: 嵌套草稿', 'description: 摘要', "date: '2026-08-23'",
        'category: 工程', 'tags: []', 'draft: true', '---', '',
      ].join('\n'))
      await writeFile(join(siteRoot, 'projects', '中文草稿.md'), [
        '---', 'title: Unicode 草稿', 'description: 摘要', "date: '2026-08-22'",
        'tags: []', 'draft: true', '---', '',
      ].join('\n'))

      const drafts = await discoverDraftSourcePaths(siteRoot)
      expect(drafts).toHaveLength(3)
      expect(drafts).toEqual(expect.arrayContaining([
        'posts/series/draft.md',
        'projects/draft.md',
        'projects/中文草稿.md',
      ]))
    } finally {
      await rm(siteRoot, { recursive: true, force: true })
    }
  })

  it('reports a nested malformed Markdown path from the filesystem', async () => {
    const siteRoot = await mkdtemp(join(tmpdir(), 'draft-discovery-invalid-'))
    try {
      await mkdir(join(siteRoot, 'posts', 'series'), { recursive: true })
      await mkdir(join(siteRoot, 'projects'))
      await writeFile(join(siteRoot, 'posts', 'series', 'broken.md'), [
        '---', 'title: 损坏嵌套文章', "date: '2026-08-25'",
        'category: 工程', 'tags: []', 'draft: true', '---', '',
      ].join('\n'))

      await expect(discoverDraftSourcePaths(siteRoot))
        .rejects.toThrow(/posts\/series\/broken\.md.*frontmatter/)
    } finally {
      await rm(siteRoot, { recursive: true, force: true })
    }
  })
})
