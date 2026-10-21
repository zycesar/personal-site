import { expect, test, type Page } from '@playwright/test'

const primaryNavigation = (page: Page) => page.locator('nav[aria-label="主导航"]')
const base = `/${(process.env.VITE_BASE_PATH ?? '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '')
const sitePath = (path: string) => `${base}${path}`

async function openMobileMenuIfVisible(page: Page): Promise<void> {
  const button = page.locator('button[aria-controls="primary-navigation"]')
  if (await button.isVisible()) {
    await button.click()
    await expect(primaryNavigation(page)).toHaveAttribute('data-open', 'true')
  }
}

// SSR 渲染时主题按钮的 aria-label 是「切换颜色模式」，水合完成后才变成「切换到深色/浅色模式」。
// 用它作为水合完成的信号：否则冷启动首次编译较慢时，点击会落在事件绑定之前而被丢弃。
async function waitForHydration(page: Page): Promise<void> {
  await expect(page.locator('button[aria-label="切换颜色模式"]')).toHaveCount(0)
}

test('hub renders the three daily cards and updates date meta', async ({ page }) => {
  await page.goto(sitePath('/english/'))
  await expect(page.getByRole('heading', { level: 1, name: '每日英语' })).toBeVisible()
  await expect(page.locator('.word-card')).toBeVisible()
  await expect(page.locator('.sentence-card')).toBeVisible()
  await expect(page.locator('.quiz-card')).toBeVisible()
  await expect(page.locator('.checkin-card')).toBeVisible()
  await expect(page.locator('.english-meta')).toContainText('内容日期')
})

test('answering the quiz grades the pick and persists check-in across reload', async ({ page }) => {
  await page.goto(sitePath('/english/'))
  await page.locator('button.quiz-option').first().click()
  await expect(page.locator('.quiz-feedback')).toBeVisible()

  await page.locator('button[aria-label="今日打卡"]').click()
  await expect(page.locator('button[aria-label="今日打卡"]')).toContainText('已打卡')

  await page.reload()
  await expect(page.locator('button[aria-label="今日打卡"]')).toContainText('已打卡')
})

test('archive lists past days and a dated page navigates between neighbors', async ({ page }) => {
  await page.goto(sitePath('/english/archive/'))
  const emptyNotice = page.locator('p', { hasText: '存档从 2026 年 10 月 12 日开始' })
  if (await emptyNotice.isVisible()) {
    test.skip(true, 'launch 前存档为空')
    return
  }
  const firstLink = page.locator('.english-archive-list a').first()
  await expect(firstLink).toBeVisible()
  await firstLink.click()

  await expect(page.getByRole('heading', { level: 1 })).toContainText('每日英语 · ')
  await expect(page.locator('.word-card')).toBeVisible()
  await expect(page.getByRole('link', { name: '返回往期' })).toBeVisible()
})

test('navigation exposes the english entry', async ({ page }) => {
  await page.goto(sitePath('/'))
  await openMobileMenuIfVisible(page)
  const link = primaryNavigation(page).getByRole('link', { name: '英语', exact: true })
  await expect(link).toBeVisible()
  await link.click()
  await expect(page).toHaveURL(/\/english\/$/)
  await expect(page.getByRole('heading', { level: 1, name: '每日英语' })).toBeVisible()
})

test('navigation exposes the term library entry', async ({ page }) => {
  await page.goto(sitePath('/'))
  await openMobileMenuIfVisible(page)
  const link = primaryNavigation(page).getByRole('link', { name: '术语', exact: true })
  await expect(link).toBeVisible()
  await link.click()
  await expect(page).toHaveURL(/\/english\/terms\/$/)
  await expect(page.getByRole('heading', { level: 1, name: '工程师英语' })).toBeVisible()
})

test('the term library lists the fullstack track with a mastery counter', async ({ page }) => {
  await page.goto(sitePath('/english/terms/'))
  await waitForHydration(page)

  await expect(page.getByRole('heading', { level: 1, name: '工程师英语' })).toBeVisible()
  await expect(page.locator('.term-card')).toHaveCount(132)
  await expect(page.locator('.term-progress-count')).toContainText('已掌握 0 / 132')
  await expect(page.locator('.term-progress-bar')).toHaveAttribute('aria-valuenow', '0')
  await expect(page.locator('.term-progress-bar')).toHaveAttribute('aria-valuemax', '132')
  await expect(page.locator('.term-card').first().locator('.term-card-term')).toContainText('frontend')
  await expect(page.locator('.term-card').first().locator('.term-card-example')).toHaveCount(0)
})

test('expanding a term reveals its example and the speech actions', async ({ page }) => {
  await page.goto(sitePath('/english/terms/'))
  await waitForHydration(page)

  const card = page.locator('.term-card').first()
  await card.locator('button.term-card-head').click()

  await expect(card.locator('.term-card-example')).toBeVisible()
  await expect(card.locator('.term-card-example-zh')).toBeVisible()
  await expect(card.getByRole('button', { name: /听术语/ })).toBeVisible()
  await expect(card.getByRole('button', { name: /听例句/ })).toBeVisible()
})

test('marking a term as known updates the counter, the progress bar and the badge', async ({ page }) => {
  await page.goto(sitePath('/english/terms/'))
  await waitForHydration(page)

  const card = page.locator('.term-card').first()
  await card.locator('button.term-card-head').click()
  await card.getByRole('button', { name: '认识', exact: true }).click()

  await expect(page.locator('.term-progress-count')).toContainText('已掌握 1 / 132')
  await expect(page.locator('.term-progress-bar')).toHaveAttribute('aria-valuenow', '1')
  await expect(card.locator('.term-card-badge')).toHaveText('已掌握')
})

test('switching tracks and filtering by category narrows the list', async ({ page }) => {
  await page.goto(sitePath('/english/terms/'))
  await waitForHydration(page)

  await page.getByRole('button', { name: '前端', exact: true }).click()
  await expect(page.locator('.term-card')).toHaveCount(16)
  for (const category of await page.locator('.term-card-category').allTextContents()) {
    expect(category).toBe('前端')
  }

  await page.getByRole('button', { name: '全部', exact: true }).click()
  await expect(page.locator('.term-card')).toHaveCount(132)

  await page.getByRole('button', { name: /Agent 工程师/ }).click()
  await expect(page.locator('.term-card')).toHaveCount(61)
  await expect(page.locator('.term-card').first().locator('.term-card-term')).toContainText('LLM')

  await page.getByRole('button', { name: 'RAG', exact: true }).click()
  await expect(page.locator('.term-card')).toHaveCount(12)
  for (const category of await page.locator('.term-card-category').allTextContents()) {
    expect(category).toBe('RAG')
  }
})

test('只看未掌握 hides the terms already marked as known', async ({ page }) => {
  await page.goto(sitePath('/english/terms/'))
  await waitForHydration(page)

  const card = page.locator('.term-card').first()
  await card.locator('button.term-card-head').click()
  await card.getByRole('button', { name: '认识', exact: true }).click()

  await page.getByRole('button', { name: '只看未掌握' }).click()
  await expect(page.locator('.term-card')).toHaveCount(131)
})

test('the term library stays usable without speech synthesis', async ({ page }) => {
  await page.addInitScript(() => {
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis
  })
  await page.goto(sitePath('/english/terms/'))
  await waitForHydration(page)

  const card = page.locator('.term-card').first()
  await card.locator('button.term-card-head').click()

  await expect(card.locator('button.speak-button')).toHaveCount(0)
  await card.getByRole('button', { name: '认识', exact: true }).click()
  await expect(page.locator('.term-progress-count')).toContainText('已掌握 1 / 132')
})
