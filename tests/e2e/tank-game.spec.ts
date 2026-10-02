import { expect, test, type Frame, type Page } from '@playwright/test'

const base = `/${(process.env.VITE_BASE_PATH ?? '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '')
const sitePath = (path: string) => `${base}${path}`

type GameState = {
  isRunning: boolean
  isPaused: boolean
  currentScore: number
  tank: { x: number; y: number }
  imageLoader: { loadedCount: number }
}

async function getGame(page: Page): Promise<Frame> {
  await expect(page.getByRole('button', { name: '结束试玩', exact: true })).toBeVisible()
  const frame = page.frames().find((candidate) => candidate.url().includes('/games/tank-battle/index.html'))
  if (!frame) throw new Error('Game frame did not load')
  await expect(frame.locator('#tank-game-canvas')).toBeVisible()
  return frame
}

async function readState(frame: Frame) {
  return frame.evaluate(() => {
    const game = (window as Window & { __tankGame__?: { instance: GameState } }).__tankGame__?.instance
    if (!game) throw new Error('Game was not initialized')
    return { running: game.isRunning, paused: game.isPaused, score: game.currentScore, x: game.tank?.x, y: game.tank?.y, images: game.imageLoader.loadedCount }
  })
}

test('loads on demand and supports controls, score persistence and repeated sessions', async ({ page }, testInfo) => {
  const gameRequests: string[] = []
  const pageErrors: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/games/tank-battle/src/')) gameRequests.push(request.url())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto(sitePath('/lab/'))
  await page.locator('.lab-card').click()
  await expect(page).toHaveURL(/\/lab\/tank-battle$/)
  await expect(page.locator('iframe')).toHaveCount(0)
  expect(gameRequests).toHaveLength(0)

  await page.getByRole('button', { name: '开始体验', exact: true }).click()
  let frame = await getGame(page)
  expect((await readState(frame)).images).toBe(6)
  const start = await readState(frame)

  if (testInfo.project.use.isMobile) {
    await frame.evaluate(() => {
      const game = (window as Window & { __tankGame__?: { instance: GameState } }).__tankGame__?.instance
      if (!game) throw new Error('Missing game')
      const target = document.querySelector('canvas')!
      const initial = new Touch({ identifier: 1, target, clientX: game.tank.x + 25, clientY: game.tank.y + 25 })
      target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, changedTouches: [initial], touches: [initial] }))
      const moved = new Touch({ identifier: 1, target, clientX: initial.clientX + 60, clientY: initial.clientY - 60 })
      target.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, changedTouches: [moved], touches: [moved] }))
      target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [moved], touches: [] }))
    })
    expect((await readState(frame)).x).toBeGreaterThan(start.x)
    expect((await readState(frame)).y).toBeLessThan(start.y)
  } else {
    await page.keyboard.down('ArrowRight')
    await expect.poll(async () => (await readState(frame)).x).toBeGreaterThan(start.x)
    await page.keyboard.up('ArrowRight')
  }

  await frame.getByRole('button', { name: '暂停', exact: true }).click()
  await expect(frame.getByRole('heading', { name: '游戏已暂停' })).toBeVisible()
  expect((await readState(frame)).paused).toBe(true)
  const paused = await readState(frame)
  await page.keyboard.press('ArrowRight')
  expect((await readState(frame)).x).toBe(paused.x)
  await frame.getByRole('button', { name: '继续游戏', exact: true }).click()
  expect((await readState(frame)).paused).toBe(false)

  await frame.evaluate(() => {
    const game = (window as Window & { __tankGame__?: { instance: GameState } }).__tankGame__?.instance
    if (game) game.currentScore = 1234
  })
  await frame.getByRole('button', { name: '重新开始', exact: true }).click()
  await expect.poll(async () => (await readState(frame)).score).toBe(0)
  await expect(frame.locator('canvas')).toHaveCount(1)
  await expect(frame.locator('[data-hud="high-score"]')).toHaveText('1234')

  await frame.getByRole('button', { name: '退出游戏', exact: true }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '开始体验', exact: true })).toBeFocused()
  await page.getByRole('button', { name: '开始体验', exact: true }).click()
  frame = await getGame(page)
  await expect(frame.locator('[data-hud="high-score"]')).toHaveText('1234')
  await page.getByRole('button', { name: '结束试玩', exact: true }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
  expect(pageErrors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('can cancel loading without leaving a game behind', async ({ page }) => {
  let releaseScript: () => void = () => {}
  const delayedScript = new Promise<void>((resolve) => { releaseScript = resolve })
  await page.route('**/games/tank-battle/src/main.js', async (route) => {
    await delayedScript
    await route.continue().catch(() => {})
  })
  await page.goto(sitePath('/lab/tank-battle'))
  await page.getByRole('button', { name: '开始体验', exact: true }).click()
  await expect(page.getByRole('button', { name: '取消加载', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '取消加载', exact: true }).click()
  releaseScript()
  await expect(page.locator('iframe')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '开始体验', exact: true })).toBeVisible()
})

test('saves the session when navigating away', async ({ page }) => {
  await page.goto(sitePath('/lab/tank-battle'))
  await page.getByRole('button', { name: '开始体验', exact: true }).click()
  const frame = await getGame(page)
  await frame.evaluate(() => {
    const game = (window as Window & { __tankGame__?: { instance: GameState } }).__tankGame__?.instance
    if (game) game.currentScore = 7654
  })
  await page.getByRole('link', { name: '王永忠首页', exact: true }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('tank-battle.high-score'))).toBe('7654')
})
