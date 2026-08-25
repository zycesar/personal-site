import { createContentLoader } from 'vitepress'

import { parsePost, visibleByDate } from '../.vitepress/data/content'

export default createContentLoader('posts/*.md', {
  excerpt: true,
  transform: (pages) => visibleByDate(
    pages
      .filter((page) => !page.url.endsWith('/posts/'))
      .map((page) => {
        try {
          return { ...page, frontmatter: parsePost(page.frontmatter) }
        } catch (error) {
          throw new Error(`Invalid post frontmatter at ${page.url}: ${String(error)}`, { cause: error })
        }
      }),
  ),
})
