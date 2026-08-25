import { Feed, type Item } from 'feed'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { type ContentPage, parsePost, visibleByDate } from '../site/.vitepress/data/content'

export type FeedPost = ContentPage

export interface NormalizeSiteUrlOptions {
  allowLoopback?: boolean
}

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.+$/, '')
  return normalized === 'localhost'
    || normalized.endsWith('.localhost')
    || normalized === '::1'
    || /^127(?:\.\d{1,3}){3}$/.test(normalized)
    || /^::ffff:7f[0-9a-f]{2}:[0-9a-f]{1,4}$/.test(normalized)
}

export function normalizeSiteUrl(
  siteUrl: string,
  { allowLoopback = false }: NormalizeSiteUrlOptions = {},
): string {
  let url: URL
  try {
    url = new URL(siteUrl)
  } catch (error) {
    throw new Error(`站点 URL 必须是有效的绝对 HTTP(S) 地址：${siteUrl}`, { cause: error })
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`站点 URL 仅支持 HTTP(S) 协议：${siteUrl}`)
  }
  if (
    url.username
    || url.password
    || url.search
    || url.hash
  ) {
    throw new Error(`站点 URL 必须是无凭据、查询参数或片段的站点根地址（可含部署路径）：${siteUrl}`)
  }
  if (!allowLoopback && isLoopbackHostname(url.hostname)) {
    throw new Error(`生产站点 URL 不能使用 localhost 或 loopback 本地地址：${siteUrl}`)
  }
  const pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  return `${url.origin}${pathname}`
}

function absoluteSiteUrl(path: string, siteUrl: string): string {
  return new URL(path.replace(/^\/+/, ''), normalizeSiteUrl(siteUrl)).href
}

export function pagePathFromRelativePath(relativePath: string): string {
  const normalized = relativePath.replaceAll('\\', '/').replace(/^\/+/, '')
  const withoutExtension = normalized.replace(/\.md$/, '')

  if (withoutExtension === 'index') return '/'
  if (withoutExtension.endsWith('/index')) {
    return `/${withoutExtension.slice(0, -'index'.length)}`
  }
  return `/${withoutExtension}`
}

export function buildFeedItems(posts: FeedPost[], siteUrl: string): Item[] {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)

  return visibleByDate(posts).map((post) => {
    let metadata
    try {
      metadata = parsePost(post.frontmatter)
    } catch (error) {
      throw new Error(`文章 ${post.url} 的元数据或日期无效：${String(error)}`, { cause: error })
    }
    const date = new Date(metadata.date)
    if (Number.isNaN(date.getTime())) {
      throw new Error(`文章 ${post.url} 的日期无效：${metadata.date}`)
    }

    return {
      title: metadata.title,
      description: metadata.description,
      link: absoluteSiteUrl(post.url, normalizedSiteUrl),
      date,
    }
  })
}

export async function generateFeed(
  siteUrl: string,
  outDir: string,
  posts: FeedPost[],
): Promise<void> {
  const url = new URL(normalizeSiteUrl(siteUrl))
  const feed = new Feed({
    title: '王永忠',
    description: '前端开发者，正在向全栈工程师成长。',
    id: url.href,
    link: url.href,
    language: 'zh-CN',
    copyright: `${new Date().getFullYear()} 王永忠`,
  })

  for (const item of buildFeedItems(posts, url.href)) {
    feed.addItem(item)
  }

  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'rss.xml'), feed.rss2(), 'utf8')
}
