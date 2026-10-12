import { expect, test, type Page } from '@playwright/test'

const primaryNavigation = (page: Page) => page.locator('nav[aria-label="主导航"]')

async function openMobileMenuIfVisible(page: Page): Promise<void> {
  const button = page.locator('button[aria-controls="primary-navigation"]')
  if (await button.isVisible()) {
    await button.click()
    await expect(primaryNavigation(page)).toHaveAttribute('data-open', 'true')
  }
}

test('hub renders the three daily cards and updates date meta', async ({ page }) => {
  await page.goto('/english/')
  await expect(page.getByRole('heading', { level: 1, name: '每日英语' })).toBeVisible()
  await expect(page.locator('.word-card')).toBeVisible()
  await expect(page.locator('.sentence-card')).toBeVisible()
  await expect(page.locator('.quiz-card')).toBeVisible()
  await expect(page.locator('.checkin-card')).toBeVisible()
  await expect(page.locator('.english-meta')).toContainText('内容日期')
})

test('answering the quiz grades the pick and persists check-in across reload', async ({ page }) => {
  await page.goto('/english/')
  await page.locator('button.quiz-option').first().click()
  await expect(page.locator('.quiz-feedback')).toBeVisible()

  await page.locator('button[aria-label="今日打卡"]').click()
  await expect(page.locator('button[aria-label="今日打卡"]')).toContainText('已打卡')

  await page.reload()
  await expect(page.locator('button[aria-label="今日打卡"]')).toContainText('已打卡')
})

test('archive lists past days and a dated page navigates between neighbors', async ({ page }) => {
  await page.goto('/english/archive/')
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
  await page.goto('/')
  await openMobileMenuIfVisible(page)
  const link = primaryNavigation(page).getByRole('link', { name: '英语', exact: true })
  await expect(link).toBeVisible()
  await link.click()
  await expect(page).toHaveURL(/\/english\/$/)
  await expect(page.getByRole('heading', { level: 1, name: '每日英语' })).toBeVisible()
})
