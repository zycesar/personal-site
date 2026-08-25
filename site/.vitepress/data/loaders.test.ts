import { describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'

type LoaderPage = {
  url: string
  frontmatter: Record<string, unknown>
  excerpt?: string
}

type LoaderOptions = {
  excerpt: boolean
  transform: (pages: LoaderPage[]) => LoaderPage[]
}

const loaders = vi.hoisted(() => new Map<string, LoaderOptions>())

vi.mock('vitepress', () => ({
  createContentLoader: (pattern: string, options: LoaderOptions) => {
    loaders.set(pattern, options)
    return { pattern, options }
  },
}))

await import('../../projects/projects.data')
await import('../../posts/posts.data')

const common = {
  description: '描述',
  tags: ['Vue'],
  draft: false,
}

describe('Markdown content loaders', () => {
  it('excludes indexes, validates project metadata, filters drafts, and sorts newest first', () => {
    const transform = loaders.get('projects/*.md')!.transform
    const result = transform([
      { url: '/projects/', frontmatter: { layout: 'projects' } },
      { url: '/projects/older', frontmatter: { ...common, title: '旧项目', date: '2026-08-20' } },
      { url: '/projects/draft', frontmatter: { ...common, title: '草稿', date: '2026-08-26', draft: true } },
      { url: '/projects/newer', frontmatter: { ...common, title: '新项目', date: '2026-08-25', featured: true } },
    ])

    expect(result.map((page) => page.url)).toEqual(['/projects/newer', '/projects/older'])
    expect(result[0].frontmatter).toMatchObject({ featured: true, example: false, draft: false })
  })

  it('validates and sorts post metadata through the post loader', () => {
    const transform = loaders.get('posts/*.md')!.transform
    const result = transform([
      { url: '/posts/', frontmatter: { layout: 'posts' } },
      { url: '/posts/older', frontmatter: { ...common, title: '旧文章', date: '2026-08-20', category: '测试' } },
      { url: '/posts/newer', frontmatter: { ...common, title: '新文章', date: '2026-08-25', category: '测试' } },
    ])

    expect(result.map((page) => page.url)).toEqual(['/posts/newer', '/posts/older'])
  })

  it('adds the content URL without discarding the original schema error', () => {
    const transform = loaders.get('posts/*.md')!.transform

    try {
      transform([{ url: '/posts/invalid', frontmatter: { title: '无效文章' } }])
      throw new Error('Expected invalid metadata to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain('/posts/invalid')
      expect((error as Error).cause).toBeInstanceOf(ZodError)
    }
  })
})
