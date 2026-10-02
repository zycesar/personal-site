import { stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type HeadConfig } from 'vitepress'

import { discoverDraftSourcePaths, isDraftSitemapUrl } from '../../scripts/discover-drafts'
import {
  generateFeed,
  normalizeSiteUrl,
  pagePathFromRelativePath,
  type FeedPost,
} from '../../scripts/generate-feed'
import { parsePost } from './data/content'
import { profile } from '../data/profile'

const SITE_TITLE = '王永忠'
const SITE_DESCRIPTION = profile.intro
const isProductionBuild = process.argv.some((argument) => argument === 'build')
const configuredSiteUrl = process.env.VITE_SITE_URL

if (isProductionBuild && !configuredSiteUrl) {
  throw new Error('生产构建缺少 VITE_SITE_URL，请设置为站点的绝对 HTTP(S) 地址后重试。')
}

const siteUrl = normalizeSiteUrl(
  configuredSiteUrl ?? 'http://localhost:5173',
  { allowLoopback: !isProductionBuild },
)
const basePath = new URL(siteUrl).pathname
const siteRoot = fileURLToPath(new URL('..', import.meta.url))
const draftPaths = await discoverDraftSourcePaths(siteRoot)
const draftRoutePaths = new Set(
  draftPaths.map((path) => pagePathFromRelativePath(path).normalize('NFC')),
)
const posts = new Map<string, FeedPost>()

function absoluteUrl(path: string): string {
  return new URL(path.replace(/^\/+/, ''), siteUrl).href
}

async function waitForSitemap(sitemapPath: string): Promise<void> {
  const timeoutAt = Date.now() + 5_000
  while (Date.now() <= timeoutAt) {
    try {
      if ((await stat(sitemapPath)).size > 0) return
    } catch {
      // VitePress 1.6.4 does not await the sitemap write stream before buildEnd.
    }
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error(`等待 sitemap.xml 写入完成超时：${sitemapPath}`)
}

export default defineConfig({
  base: basePath,
  lang: 'zh-CN',
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  cleanUrls: true,
  srcExclude: isProductionBuild ? draftPaths : [],
  sitemap: {
    hostname: siteUrl,
    transformItems(items) {
      return items.filter((item) => !isDraftSitemapUrl(item.url, draftRoutePaths, siteUrl))
    },
  },
  transformPageData(pageData) {
    const relativePath = pageData.relativePath.replaceAll('\\', '/')
    if (!relativePath.startsWith('posts/') || relativePath === 'posts/index.md') return

    try {
      posts.set(relativePath, {
        url: pagePathFromRelativePath(relativePath),
        frontmatter: parsePost(pageData.frontmatter),
      })
    } catch (error) {
      throw new Error(`文章 ${relativePath} 的 frontmatter 无效：${String(error)}`, { cause: error })
    }
  },
  transformHead({ pageData }): HeadConfig[] {
    const path = pagePathFromRelativePath(pageData.relativePath)
    const canonical = absoluteUrl(path)
    const title = typeof pageData.frontmatter.title === 'string'
      ? pageData.frontmatter.title
      : pageData.title || SITE_TITLE
    const description = typeof pageData.frontmatter.description === 'string'
      ? pageData.frontmatter.description
      : pageData.description || SITE_DESCRIPTION
    const cover = typeof pageData.frontmatter.cover === 'string'
      ? pageData.frontmatter.cover
      : '/og-default.svg'
    const image = absoluteUrl(cover)
    const isPost = path.startsWith('/posts/') && path !== '/posts/'

    return [
      ['link', { rel: 'canonical', href: canonical }],
      ['meta', { property: 'og:type', content: isPost ? 'article' : 'website' }],
      ['meta', { property: 'og:url', content: canonical }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: image }],
    ]
  },
  async buildEnd({ outDir }) {
    const sitemapPath = join(outDir, 'sitemap.xml')
    await waitForSitemap(sitemapPath)

    await generateFeed(siteUrl, outDir, [...posts.values()])
    const sitemapUrl = absoluteUrl('/sitemap.xml')
    await writeFile(
      join(outDir, 'robots.txt'),
      `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`,
      'utf8',
    )
  },
})
