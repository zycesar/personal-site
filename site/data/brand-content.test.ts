import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'

import { parsePost, parseProject, visibleByDate } from '../.vitepress/data/content'
import { profile } from './profile'

function readContent(directory: string) {
  const root = join(process.cwd(), 'site', directory)
  return readdirSync(root)
    .filter((filename) => filename.endsWith('.md') && filename !== 'index.md')
    .map((filename) => {
      const source = readFileSync(join(root, filename), 'utf8')
      const { data, content } = matter(source)
      return { url: `/${directory}/${filename.replace(/\.md$/, '')}`, frontmatter: data, content }
    })
}

describe('technical brand content', () => {
  it('grounds the public profile in established frontend experience and fullstack practice', () => {
    expect(profile.role).toBe('前端工程师 · 全栈实践者')
    expect(profile.intro).toContain('近 10 年')
    expect(profile.intro).not.toContain('正在向全栈工程师成长')
    expect(profile.links).toEqual([])
  })

  it('publishes three real case studies rather than placeholder projects', () => {
    const projects = visibleByDate(readContent('projects'))
    expect(projects).toHaveLength(3)
    expect(projects.map(({ frontmatter }) => frontmatter.title)).toEqual([
      '爆卡营微信商城与管理后台', '魔介表单系统', '魔介 AI 智能助手 H5',
    ])
    for (const project of projects) {
      expect(parseProject(project.frontmatter)).toMatchObject({ featured: true, example: false })
      expect(project.content).toContain('## 我的角色')
      expect(project.content).toContain('## 关键实践')
      expect(project.content).toContain('## 后续复盘方向')
      expect(project.content).not.toContain('示例项目')
    }
  })

  it('keeps sample articles in draft instead of presenting them as published work', () => {
    const posts = readContent('posts')
    expect(posts).toHaveLength(3)
    expect(visibleByDate(posts)).toHaveLength(0)
    for (const post of posts) expect(parsePost(post.frontmatter).draft).toBe(true)
  })

  it('does not publish unconfirmed contact details or business metrics', () => {
    const about = readFileSync(join(process.cwd(), 'site/about.md'), 'utf8')
    const publicContent = JSON.stringify(profile) + about + readContent('projects').map(({ content }) => content).join('\n')
    expect(publicContent).not.toMatch(/1[3-9]\d{9}|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\d[\d,.]*\s*(?:万元|元|%)/i)
  })
})
