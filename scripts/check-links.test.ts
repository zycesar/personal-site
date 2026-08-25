// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// @ts-expect-error The production module is JavaScript and intentionally has no declaration file.
import * as checkerModule from './check-links.mjs'

interface LinkFailure {
  source: string
  href: string
  reason: string
}

interface LinkCheckResult {
  htmlFiles: number
  checkedLinks: number
  failures: LinkFailure[]
}

const { checkBuiltLinks } = checkerModule as unknown as {
  checkBuiltLinks: (distDir: string) => Promise<LinkCheckResult>
}

describe('built link checker', () => {
  let distDir: string

  beforeEach(async () => {
    distDir = await mkdtemp(join(tmpdir(), 'built-links-'))
  })

  afterEach(async () => {
    await rm(distDir, { recursive: true, force: true })
  })

  async function write(relativePath: string, content = ''): Promise<void> {
    const path = join(distDir, relativePath)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content, 'utf8')
  }

  it('parses quoted, unquoted, and entity-decoded href attributes', async () => {
    await Promise.all(['double.html', 'single.html', 'unquoted.html'].map((path) => write(path)))
    await write('index.html', [
      '<a href="/double">double</a>',
      "<a href='/single'>single</a>",
      '<a href=/unquoted>unquoted</a>',
      '<a href="&#47;decimal-missing">decimal</a>',
      '<a href="&#x2f;hex-missing">hex</a>',
      '<a href="&sol;named-missing">named</a>',
    ].join('\n'))

    const result = await checkBuiltLinks(distDir)

    expect(result.checkedLinks).toBe(6)
    expect(result.failures.map(({ href }) => href)).toEqual([
      '/decimal-missing',
      '/hex-missing',
      '/named-missing',
    ])
  })

  it('strips query and hash and resolves Unicode clean paths', async () => {
    await write('index.html', '<a href="/about?from=home#bio">about</a><a href="/文章/">文章</a>')
    await write('about.html')
    await write('文章/index.html')

    await expect(checkBuiltLinks(distDir)).resolves.toMatchObject({
      checkedLinks: 2,
      failures: [],
    })
  })

  it('checks existing and missing asset hrefs', async () => {
    await write('index.html', '<link href="/assets/site.css"><a href="/files/missing.pdf">PDF</a>')
    await write('assets/site.css', 'body {}')

    const result = await checkBuiltLinks(distDir)

    expect(result.checkedLinks).toBe(2)
    expect(result.failures.map(({ href }) => href)).toEqual(['/files/missing.pdf'])
  })

  it('rejects encoded and bare traversal including Windows backslashes', async () => {
    await write('index.html', [
      '<a href="/../outside">slash traversal</a>',
      '<a href="/%2e%2e%5coutside.css">encoded backslash</a>',
      '<a href="/..\\outside.css">bare backslash</a>',
    ].join('\n'))

    const result = await checkBuiltLinks(distDir)

    expect(result.failures).toHaveLength(3)
    expect(result.failures.every(({ reason }) => reason.includes('目录穿越'))).toBe(true)
  })

  it('collects every broken link with its source and decoded href', async () => {
    await write('index.html', '<a href="&#47;missing-a">A</a><a href=/missing-b>B</a>')

    const result = await checkBuiltLinks(distDir)

    expect(result.failures).toHaveLength(2)
    expect(result.failures.map(({ href }) => href)).toEqual(['/missing-a', '/missing-b'])
    expect(result.failures.every(({ source }) => source === join(distDir, 'index.html'))).toBe(true)
  })
})
