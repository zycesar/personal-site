import { createContentLoader } from 'vitepress'

import { parseProject, visibleByDate } from '../.vitepress/data/content'

export default createContentLoader('projects/*.md', {
  excerpt: true,
  transform: (pages) => visibleByDate(
    pages
      .filter((page) => !page.url.endsWith('/projects/'))
      .map((page) => {
        try {
          return { ...page, frontmatter: parseProject(page.frontmatter) }
        } catch (error) {
          throw new Error(`Invalid project frontmatter at ${page.url}: ${String(error)}`, { cause: error })
        }
      }),
  ),
})
