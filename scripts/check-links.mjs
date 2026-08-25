import { readdir, readFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'parse5'

const scriptPath = fileURLToPath(import.meta.url)
const projectRoot = resolve(scriptPath, '..', '..')
const defaultDistDir = resolve(projectRoot, 'site', '.vitepress', 'dist')

async function findFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? findFiles(path) : (entry.isFile() ? [path] : [])
  }))
  return files.flat()
}

function extractHrefs(html) {
  const hrefs = []
  const visit = (node) => {
    const href = node.attrs?.find(({ name }) => name === 'href')
    if (href) hrefs.push(href.value.trim())
    for (const child of node.childNodes ?? []) visit(child)
    if (node.content) visit(node.content)
  }
  visit(parse(html))
  return hrefs
}

function normalizeBasePath(basePath) {
  const normalized = `/${basePath.replace(/^\/+|\/+$/g, '')}/`
  return normalized === '//' ? '/' : normalized
}

function candidatesForHref(href, distDir, basePath) {
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

  const normalizedBasePath = normalizeBasePath(basePath)
  const baseWithoutTrailingSlash = normalizedBasePath.replace(/\/$/, '')
  if (normalizedBasePath !== '/') {
    if (decoded === baseWithoutTrailingSlash) decoded = '/'
    else if (decoded.startsWith(normalizedBasePath)) decoded = `/${decoded.slice(normalizedBasePath.length)}`
    else throw new Error(`链接未包含部署基础路径 ${normalizedBasePath}`)
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

function staysInsideDist(path, distDir) {
  const pathFromDist = relative(distDir, path)
  return pathFromDist !== '..' && !pathFromDist.startsWith(`..${sep}`) && !isAbsolute(pathFromDist)
}

export async function checkBuiltLinks(
  distDirectory = defaultDistDir,
  { basePath = '/' } = {},
) {
  const distDir = resolve(distDirectory)
  const distFiles = await findFiles(distDir)
  const htmlPaths = distFiles.filter((path) => path.endsWith('.html'))
  const existingFiles = new Set(distFiles.map((path) => resolve(path)))
  const failures = []
  let checkedLinks = 0

  for (const source of htmlPaths) {
    const html = await readFile(source, 'utf8')
    for (const href of extractHrefs(html)) {
      let candidates
      try {
        candidates = candidatesForHref(href, distDir, basePath)
      } catch (error) {
        failures.push({ source, href, reason: error.message })
        continue
      }
      if (candidates.length === 0) continue
      checkedLinks += 1
      if (candidates.some((candidate) => !staysInsideDist(candidate, distDir))) {
        failures.push({ source, href, reason: '解析结果位于 dist 之外' })
        continue
      }
      if (!candidates.some((candidate) => existingFiles.has(candidate))) {
        failures.push({ source, href, reason: '找不到对应的构建文件' })
      }
    }
  }

  return { htmlFiles: htmlPaths.length, checkedLinks, failures }
}

export async function runLinkCheck(distDir = defaultDistDir) {
  const result = await checkBuiltLinks(distDir, {
    basePath: process.env.VITE_BASE_PATH ?? '/',
  })
  if (result.failures.length > 0) {
    console.error(`发现 ${result.failures.length} 个无效内部链接：`)
    for (const failure of result.failures) {
      console.error(`- ${relative(projectRoot, failure.source)} -> ${failure.href} (${failure.reason})`)
    }
    return 1
  }

  console.log(`内部链接检查通过：${result.htmlFiles} 个 HTML 文件，${result.checkedLinks} 个导航链接。`)
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  process.exitCode = await runLinkCheck()
}
