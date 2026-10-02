import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Game } from '../../public/games/tank-battle/src/game.js'
import { isTouchDevice } from '../../public/games/tank-battle/src/input.js'

let game
let frames

beforeEach(() => {
  frames = new Map()
  let frameId = 0
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
    frames.set(++frameId, callback)
    return frameId
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((frame) => frames.delete(frame)))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    scale: vi.fn(), clearRect: vi.fn(),
  })
  game = new Game()
  vi.spyOn(game.imageLoader, 'loadAll').mockResolvedValue(undefined)
})

afterEach(() => {
  game.destroy()
  document.querySelectorAll('canvas').forEach((canvas) => canvas.remove())
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('embedded game lifecycle', () => {
  it('uses actual touch capability rather than the presence of a touch event property', () => {
    vi.stubGlobal('navigator', { maxTouchPoints: 0 })
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    expect(isTouchDevice()).toBe(false)
    vi.stubGlobal('navigator', { maxTouchPoints: 5 })
    expect(isTouchDevice()).toBe(true)
  })

  it('releases keyboard capture, canvas and animation when stopped', async () => {
    await game.start()
    const activeKey = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    window.dispatchEvent(activeKey)
    expect(activeKey.defaultPrevented).toBe(true)

    game.stop()
    const stoppedKey = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    window.dispatchEvent(stoppedKey)
    expect(stoppedKey.defaultPrevented).toBe(false)
    expect(document.querySelectorAll('canvas')).toHaveLength(0)
    expect(frames.size).toBe(0)
  })

  it('keeps one canvas and one animation loop across repeated sessions', async () => {
    for (let session = 0; session < 3; session++) {
      await game.start()
      expect(document.querySelectorAll('canvas')).toHaveLength(1)
      expect(frames.size).toBe(1)
      game.stop()
    }
  })

  it('does not start a cancelled asynchronous load or load twice concurrently', async () => {
    let finishLoading
    game.imageLoader.loadAll.mockImplementation(() => new Promise((resolve) => { finishLoading = resolve }))
    const starting = game.start()
    const duplicate = game.start()
    expect(game.imageLoader.loadAll).toHaveBeenCalledTimes(1)
    game.stop()
    finishLoading()
    await Promise.all([starting, duplicate])
    expect(game.isRunning).toBe(false)
    expect(document.querySelectorAll('canvas')).toHaveLength(0)
    expect(frames.size).toBe(0)
  })

  it('pauses without resetting the session and resumes exactly one loop', async () => {
    await game.start()
    game.currentScore = 800
    const player = game.tank
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    game.pause()
    expect(game.isPaused).toBe(true)
    expect(frames.size).toBe(0)
    expect(game.input.keysPressed.size).toBe(0)
    expect(game.getHighScore()).toBe(800)
    game.resume()
    game.resume()
    expect(game.isPaused).toBe(false)
    expect(game.currentScore).toBe(800)
    expect(game.tank).toBe(player)
    expect(frames.size).toBe(1)
  })
})
