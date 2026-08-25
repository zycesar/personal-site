import { readdir, readFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distDir = resolve(projectRoot, 'site', '.vitepress', 'dist')
async function findFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? findFiles(path) : (entry.isFile() ? [path] : [])
  }))
  return files.flat()
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
}

function candidatesForHref(href) {
  const pathname = href.split(/[?#]/, 1)[0]
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) return []

  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    throw new Error('URL 百分号编码无效')
  }
  if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').includes('..')) {
    throw new Error('链接包含目录穿越')
  }

  const extension = extname(decoded).toLowerCase()
  const relativePath = decoded.replace(/^\/+/, '')
  if (decoded === '/') return [resolve(distDir, 'index.html')]
  if (decoded.endsWith('/')) return [resolve(distDir, relativePath, 'index.html')]
  if (extension) return [resolve(distDir, relativePath)]
  return [
    resolve(distDir, `${relativePath}.html`),
    resolve(distDir, relativePath, 'index.html'),
  ]
}

function staysInsideDist(path) {
  const pathFromDist = relative(distDir, path)
  return pathFromDist !== '..' && !pathFromDist.startsWith(`..${sep}`) && !isAbsolute(pathFromDist)
}

const distFiles = await findFiles(distDir)
const htmlFiles = distFiles.filter((path) => path.endsWith('.html'))
const existingFiles = new Set(distFiles.map((path) => resolve(path)))
const failures = []
let checkedLinks = 0

for (const source of htmlFiles) {
  const html = await readFile(source, 'utf8')
  const hrefPattern = /\bhref\s*=\s*(["'])(.*?)\1/gi
  for (const match of html.matchAll(hrefPattern)) {
    const href = decodeHtmlAttribute(match[2].trim())
    let candidates
    try {
      candidates = candidatesForHref(href)
    } catch (error) {
      failures.push({ source, href, reason: error.message })
      continue
    }
    if (candidates.length === 0) continue
    checkedLinks += 1
    if (candidates.some((candidate) => !staysInsideDist(candidate))) {
      failures.push({ source, href, reason: '解析结果位于 dist 之外' })
      continue
    }
    if (!candidates.some((candidate) => existingFiles.has(candidate))) {
      failures.push({ source, href, reason: '找不到对应的构建文件' })
    }
  }
}

if (failures.length > 0) {
  console.error(`发现 ${failures.length} 个无效内部链接：`)
  for (const failure of failures) {
    console.error(`- ${relative(projectRoot, failure.source)} -> ${failure.href} (${failure.reason})`)
  }
  process.exitCode = 1
} else {
  console.log(`内部链接检查通过：${htmlFiles.length} 个 HTML 文件，${checkedLinks} 个导航链接。`)
}
