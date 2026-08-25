import { expect, type Page, test } from '@playwright/test'

const mobileMenu = (page: Page) => page.locator('button[aria-controls="primary-navigation"]')
const primaryNavigation = (page: Page) => page.locator('nav[aria-label="主导航"]')
const deploymentBasePath = `/${(process.env.VITE_BASE_PATH ?? '/').replace(/^\/+|\/+$/g, '')}/`

function sitePath(path = '/'): string {
  if (path === '/') return deploymentBasePath
  return `${deploymentBasePath.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const hasNoHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )
  expect(hasNoHorizontalOverflow).toBe(true)
}

async function openMobileMenuIfVisible(page: Page): Promise<boolean> {
  const button = mobileMenu(page)
  if (!await button.isVisible()) return false

  await expect(primaryNavigation(page)).toHaveAttribute('data-open', 'false')
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await expect(button).toHaveAttribute('aria-label', '打开导航菜单')
  await button.click()
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  await expect(button).toHaveAttribute('aria-label', '关闭导航菜单')
  await expect(primaryNavigation(page)).toHaveAttribute('data-open', 'true')
  return true
}

async function navigateFromHome(page: Page, label: string, path: RegExp): Promise<void> {
  await page.goto(sitePath())
  const usedMobileMenu = await openMobileMenuIfVisible(page)
  const link = primaryNavigation(page).getByRole('link', { name: label, exact: true })
  await expect(link).toBeVisible()
  await link.click()
  await expect(page).toHaveURL(path)
  await expectNoHorizontalOverflow(page)

  if (usedMobileMenu) {
    await expect(primaryNavigation(page)).toHaveAttribute('data-open', 'false')
  }
}

test('covers the critical visitor journey', async ({ page }) => {
  await page.goto(sitePath())
  await expect(page.getByRole('heading', { level: 1 })).toContainText('好用的体验')
  await expectNoHorizontalOverflow(page)

  await navigateFromHome(page, '项目', /\/projects\/$/)
  await navigateFromHome(page, '文章', /\/posts\/$/)
  await navigateFromHome(page, '关于', /\/about\/?$/)

  await page.goto(sitePath('/projects/'))
  await expect(page.getByRole('heading', { level: 1, name: '项目' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await expect(page.locator('[data-example]', { hasText: '示例项目' })).toHaveCount(2)
  const projectCards = page.locator('a.project-card')
  await expect(projectCards).toHaveCount(2)
  const firstProject = projectCards.first()
  const projectTitle = await firstProject.getByRole('heading').innerText()
  const projectPath = await firstProject.getAttribute('href')
  expect(projectPath).toBeTruthy()
  await firstProject.click()
  await expect(page).toHaveURL(new RegExp(`${projectPath?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
  await expect(page.getByRole('heading', { level: 1 })).toContainText(projectTitle)
  await expectNoHorizontalOverflow(page)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(projectTitle)
  await expectNoHorizontalOverflow(page)
  await expect(page.getByRole('heading', { name: '这个页面不存在' })).toHaveCount(0)

  await page.goto(sitePath('/posts/'))
  await expect(page.getByRole('heading', { level: 1, name: '文章' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  const articleCards = page.locator('a.post-card')
  await expect(articleCards).toHaveCount(3)
  const firstArticle = articleCards.first()
  const articleTitle = await firstArticle.getByRole('heading').innerText()
  const articlePath = await firstArticle.getAttribute('href')
  expect(articlePath).toBeTruthy()
  await firstArticle.click()
  await expect(page).toHaveURL(new RegExp(`${articlePath?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
  await expect(page.getByRole('heading', { level: 1 })).toContainText(articleTitle)
  await expectNoHorizontalOverflow(page)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(articleTitle)
  await expectNoHorizontalOverflow(page)
  await expect(page.getByRole('heading', { name: '这个页面不存在' })).toHaveCount(0)
})

test('persists an explicit dark theme and renders the custom 404', async ({ page }) => {
  await page.goto(sitePath())
  const themeToggle = page.getByRole('button', { name: '切换到深色模式' })
  await expect(themeToggle).toBeVisible()
  await themeToggle.click()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.getByRole('button', { name: '切换到浅色模式' })).toBeVisible()
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.getByRole('button', { name: '切换到浅色模式' })).toBeVisible()

  await page.goto(sitePath('/missing-page'))
  await expect(page.getByRole('heading', { level: 1, name: '这个页面不存在' })).toBeVisible()
  await expect(page.getByRole('link', { name: '返回首页' })).toBeVisible()
})

test('hydrates cleanly from the system dark preference', async ({ page }) => {
  const consoleProblems: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      consoleProblems.push(message.text())
    }
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto(sitePath())
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.getByRole('button', { name: '切换到浅色模式' })).toBeVisible()

  expect(consoleProblems).toEqual([])
  expect(pageErrors).toEqual([])
})

test('disables card transitions when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(sitePath())
  const transitionDurations = await page.locator('.card').first().evaluate((card) =>
    getComputedStyle(card).transitionDuration.split(',').map((duration) => duration.trim()),
  )
  const durationInSeconds = (duration: string) =>
    duration.endsWith('ms') ? Number.parseFloat(duration) / 1000 : Number.parseFloat(duration)

  expect(Math.max(...transitionDurations.map(durationInSeconds))).toBeLessThanOrEqual(0.00001)
})

test('mobile menu exposes links and closes after navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.isMobile !== true, 'Mobile-specific responsive behavior')

  await page.goto(sitePath())
  const navigation = primaryNavigation(page)
  await expect(navigation).toHaveAttribute('data-open', 'false')
  await expect(navigation).toBeHidden()
  await expect(mobileMenu(page)).toHaveAttribute('aria-expanded', 'false')

  await expect(await openMobileMenuIfVisible(page)).toBe(true)
  const projectsLink = navigation.getByRole('link', { name: '项目', exact: true })
  await expect(projectsLink).toBeVisible()
  await projectsLink.click()
  await expect(page).toHaveURL(/\/projects\/$/)
  await expect(navigation).toHaveAttribute('data-open', 'false')
  await expect(navigation).toBeHidden()
})
