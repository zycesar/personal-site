import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'

import { parsePost, parseProject } from '../site/.vitepress/data/content'

export interface DraftCandidate {
  relativePath: string
  frontmatter: Record<string, unknown>
}

export function draftSourcePaths(pages: DraftCandidate[]): string[] {
  const drafts: string[] = []

  for (const page of pages) {
    const relativePath = page.relativePath.replaceAll('\\', '/')
    const isPost = relativePath.startsWith('posts/')
    const isProject = relativePath.startsWith('projects/')
    if (
      (!isPost && !isProject)
      || relativePath === 'posts/index.md'
      || relativePath === 'projects/index.md'
    ) continue

    try {
      const metadata = isPost
        ? parsePost(page.frontmatter)
        : parseProject(page.frontmatter)
      if (metadata.draft) drafts.push(relativePath)
    } catch (error) {
      throw new Error(`${relativePath} 的 frontmatter 无效：${String(error)}`, { cause: error })
    }
  }

  return drafts
}

async function readMarkdownCandidates(
  siteRoot: string,
  section: 'posts' | 'projects',
  directory = join(siteRoot, section),
): Promise<DraftCandidate[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const candidates = await Promise.all(entries.map(async (entry): Promise<DraftCandidate[]> => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return readMarkdownCandidates(siteRoot, section, path)
    if (!entry.isFile() || !entry.name.endsWith('.md')) return []

    const relativePath = `${section}/${path.slice(join(siteRoot, section).length + 1)}`
      .replaceAll('\\', '/')
    try {
      const source = await readFile(path, 'utf8')
      return [{ relativePath, frontmatter: matter(source).data }]
    } catch (error) {
      throw new Error(`无法读取或解析 ${relativePath} 的 frontmatter：${String(error)}`, { cause: error })
    }
  }))
  return candidates.flat()
}

export async function discoverDraftSourcePaths(siteRoot: string): Promise<string[]> {
  const pages = (await Promise.all([
    readMarkdownCandidates(siteRoot, 'posts'),
    readMarkdownCandidates(siteRoot, 'projects'),
  ])).flat()
  return draftSourcePaths(pages)
}

export function isDraftSitemapUrl(
  itemUrl: string,
  draftRoutePaths: ReadonlySet<string>,
  siteUrl: string,
): boolean {
  const pathname = decodeURIComponent(new URL(itemUrl, siteUrl).pathname).normalize('NFC')
  return draftRoutePaths.has(pathname)
}
