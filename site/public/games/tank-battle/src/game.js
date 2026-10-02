/**
 * game.js —— 游戏主控：主循环（30FPS）、刷怪、碰撞、波次、死亡复位、最高分。
 * 对照原作 class GS。
 */
import {
  WAVES,
  RUNTIME,
  COLORS,
  SCORE_BONUS_MIN,
  SCORE_BONUS_RANGE,
  MISSILE_SPAWN,
  resolveWave,
  resolveMissileInterval,
} from './config.js';
import { Player } from './player.js';
import { spawnEnemy, spawnMissile } from './enemy.js';
import { Explosion, PowerUpText, WaveNotification } from './effects.js';
import { InputController, isTouchDevice } from './input.js';
import { SpriteLoader } from './assets.js';

export class Game {
  constructor({ hud, onHighScoreChange, onStateChange } = {}) {
    this.canvas = null;
    this.ctx = null;
    this.tank = null;
    this.hud = hud ?? null;
    this.onHighScoreChange = onHighScoreChange ?? null;
    this.onStateChange = onStateChange ?? null;
    this.imageLoader = new SpriteLoader();
    this.input = null;

    this.bullets = [];
    this.enemies = [];
    this.explosions = [];
    this.powerUpTexts = [];
    this.waveNotification = null;

    this.isRunning = false;
    this.isStarting = false;
    this.isPaused = false;
    this.startVersion = 0;
    this.animationFrame = null;
    this.isPageVisible = true;
    this.lastTime = 0;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / RUNTIME.targetFPS;

    this.enemySpawnInterval = WAVES[0].spawnInterval;
    this.lastEnemySpawnTime = 0;
    this.missileSpawnInterval = MISSILE_SPAWN.initialInterval;
    this.lastMissileSpawnTime = 0;

    this.currentScore = 0;
    this.highScore = 0;
    this.currentWave = 1;
    this.currentWaveConfig = WAVES[0];
    this.gameStartTime = 0;

    // 复用同一个 rAF 回调引用，避免重复绑定
    this.gameLoop = this.gameLoop.bind(this);
  }

  get bounds() {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  async start() {
    if (this.isRunning || this.isStarting) return;
    const version = ++this.startVersion;
    this.isStarting = true;
    try {
      await this.imageLoader.loadAll();
      if (version !== this.startVersion) return;
      this.loadHighScore();
      this.createCanvas();
      this.createTank();
      this.bindEvents();
      this.resetState();
      this.isRunning = true;
      this.isPaused = false;
      this.isPageVisible = !document.hidden;
      this.lastTime = performance.now();
      this.lastFrameTime = this.lastTime;
      this.gameStartTime = this.lastTime;
      this.waveNotification = new WaveNotification(WAVES[0].name, isTouchDevice());
      this.hud?.setVisible(true);
      this.syncHud();
      this.animationFrame = requestAnimationFrame(this.gameLoop);
      if (document.hidden) this.pause();
    } catch (error) {
      this.stop();
      throw error;
    } finally {
      if (version === this.startVersion) this.isStarting = false;
      this.onStateChange?.();
    }
  }

  stop() {
    this.startVersion += 1;
    this.isStarting = false;
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.saveHighScore();
    this.input?.reset();
    this.unbindEvents();
    this.input = null;
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
    this.tank = null;
    this.bullets = [];
    this.enemies = [];
    this.explosions = [];
    this.powerUpTexts = [];
    this.waveNotification = null;
    this.hud?.setVisible(false);
    this.onStateChange?.();
  }

  destroy() {
    this.stop();
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.input?.reset();
    this.input?.unbind();
    this.saveHighScore();
    this.onStateChange?.();
  }

  resume() {
    if (!this.isRunning || !this.isPaused || document.hidden) return;
    this.isPaused = false;
    this.isPageVisible = true;
    this.lastTime = performance.now();
    this.lastFrameTime = this.lastTime;
    this.input?.bind();
    this.animationFrame = requestAnimationFrame(this.gameLoop);
    this.onStateChange?.();
  }

  /** 清空一局的全部状态（不含最高分） */
  resetState() {
    this.bullets = [];
    this.enemies = [];
    this.explosions = [];
    this.powerUpTexts = [];
    this.currentScore = 0;
    this.currentWave = 1;
    this.currentWaveConfig = WAVES[0];
    this.enemySpawnInterval = WAVES[0].spawnInterval;
    this.missileSpawnInterval = MISSILE_SPAWN.initialInterval;
    this.lastMissileSpawnTime = 0;
    this.lastEnemySpawnTime = 0;
    this.gameStartTime = performance.now();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'tank-game-canvas';

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      touch-action: none;
    `;
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) throw new Error('当前浏览器无法创建游戏画布，请换一个浏览器重试。');
    this.ctx.scale(dpr, dpr);
  }

  createTank() {
    const bounds = this.bounds;
    const x = bounds.width / 2 - 25;
    const y = bounds.height - 140;
    this.tank = new Player(x, y);
  }

  bindEvents() {
    this.input = new InputController({
      canvas: this.canvas,
      getPlayer: () => this.tank,
      getBounds: () => this.bounds,
      onVisibilityChange: (visible) => {
        this.isPageVisible = visible;
        if (!visible) this.pause();
      },
    });
    this.input.onResize = () => this.handleResize();
    this.input.bind();

    window.addEventListener('tank-score-updated', this.handleExternalScore);
  }

  unbindEvents() {
    this.input?.unbind();
    window.removeEventListener('tank-score-updated', this.handleExternalScore);
  }

  handleExternalScore = (event) => {
    const next = Number(event?.detail?.newScore);
    if (Number.isFinite(next) && next > this.highScore) {
      this.highScore = next;
      this.syncHud();
    }
  };

  handleResize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    if (this.ctx) this.ctx.scale(dpr, dpr);
  }

  /** 固定 30FPS 步进（对照原作 gameLoop） */
  gameLoop(timestamp) {
    this.animationFrame = null;
    if (!this.isRunning || this.isPaused) return;

    const sinceLastFrame = timestamp - this.lastFrameTime;
    if (sinceLastFrame < this.frameInterval) {
      this.animationFrame = requestAnimationFrame(this.gameLoop);
      return;
    }
    if (!this.isPageVisible) {
      this.animationFrame = requestAnimationFrame(this.gameLoop);
      return;
    }

    const dt = Math.min(timestamp - this.lastTime, 100);
    this.lastTime = timestamp;
    this.lastFrameTime = timestamp - (sinceLastFrame % this.frameInterval);

    this.update(dt);
    this.render();
    this.animationFrame = requestAnimationFrame(this.gameLoop);
  }

  update(dt) {
    const bounds = this.bounds;

    if (this.tank) {
      this.tank.update(dt);
      this.input?.applyKeyboardMovement(this.tank, dt);
      // 收集自动开火产生的子弹
      for (const bullet of this.tank.drainBullets()) this.addBullet(bullet);
    }

    this.bullets = this.bullets.filter((bullet) => {
      bullet.update(dt, bounds);
      return bullet.active;
    });
    if (this.bullets.length > RUNTIME.maxBullets) {
      this.bullets.splice(0, this.bullets.length - RUNTIME.maxBullets);
    }

    this.enemies = this.enemies.filter((enemy) => {
      enemy.update(dt, bounds);
      return enemy.active;
    });
    if (this.enemies.length > RUNTIME.maxEnemies) {
      this.enemies.splice(0, this.enemies.length - RUNTIME.maxEnemies);
    }

    this.explosions = this.explosions.filter((explosion) => {
      explosion.update(dt);
      return explosion.active;
    });

    this.powerUpTexts = this.powerUpTexts.filter((text) => {
      text.update(dt);
      return text.active;
    });

    if (this.waveNotification) {
      this.waveNotification.update(dt);
      if (!this.waveNotification.active) this.waveNotification = null;
    }

    this.checkAndUpdateWave();

    // 刷怪
    this.lastEnemySpawnTime += dt;
    if (this.lastEnemySpawnTime >= this.enemySpawnInterval) {
      if (this.enemies.length < RUNTIME.maxEnemies) this.spawnEnemy();
      this.lastEnemySpawnTime = 0;
    }

    // 第2波起独立导弹
    if (this.currentWave >= 2) {
      this.lastMissileSpawnTime += dt;
      if (this.lastMissileSpawnTime >= this.missileSpawnInterval) {
        this.spawnMissile();
        this.lastMissileSpawnTime = 0;
      }
    }

    this.checkCollisions();
    this.syncHud();
  }

  /** 依据累计分数切换波次 */
  checkAndUpdateWave() {
    const next = resolveWave(this.currentScore);
    if (next.waveNumber === this.currentWave) return;

    this.currentWave = next.waveNumber;
    this.currentWaveConfig = next;
    this.enemySpawnInterval = next.spawnInterval;
    if (this.currentWave >= 2) {
      this.missileSpawnInterval = resolveMissileInterval(this.currentWave);
    }
    this.waveNotification = new WaveNotification(next.name, isTouchDevice());
  }

  spawnEnemy() {
    const bounds = this.bounds;
    const target = this.tank
      ? { x: this.tank.x + this.tank.width / 2, y: this.tank.y + this.tank.height / 2 }
      : null;
    this.enemies.push(
      spawnEnemy(bounds, this.currentWaveConfig, this.currentWave, target),
    );
  }

  spawnMissile() {
    const bounds = this.bounds;
    if (!this.tank) return;
    const target = { x: this.tank.x + this.tank.width / 2, y: this.tank.y + this.tank.height / 2 };
    const missile = spawnMissile(bounds, this.currentWaveConfig, target);
    if (missile) this.enemies.push(missile);
  }

  /** 子弹命中敌人 -> 计分/掉落；敌人撞玩家 -> 扣盾或死亡 */
  checkCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (!isColliding(bullet, enemy)) continue;

        bullet.active = false;
        const killed = enemy.takeDamage();
        if (killed) {
          this.handleEnemyKilled(enemy);
        }
        break;
      }
    }

    if (!this.tank) return;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!isColliding(this.tank, enemy)) continue;

      enemy.active = false;
      this.explosions.push(
        new Explosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2),
      );
      this.handlePlayerHit(enemy);
      break;
    }
  }

  handleEnemyKilled(enemy) {
    this.explosions.push(
      new Explosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2),
    );
    this.currentScore += enemy.config.score;

    const powerUp = enemy.config.powerUp;
    if (powerUp && this.tank) {
      if (powerUp.type === 'scoreBonus') {
        const bonus = Math.floor(Math.random() * SCORE_BONUS_RANGE) + SCORE_BONUS_MIN;
        this.currentScore += bonus;
        if (enemy.config.imageKey === 'resourceBox') {
          this.powerUpTexts.push(
            new PowerUpText(
              enemy.x + enemy.width + 10,
              enemy.y + enemy.height / 2,
              'scoreBonus',
              `+${bonus}`,
            ),
          );
        }
      } else {
        this.tank.applyPowerUp(powerUp);
        if (enemy.config.imageKey === 'resourceBox') {
          this.powerUpTexts.push(
            new PowerUpText(
              enemy.x + enemy.width + 10,
              enemy.y + enemy.height / 2,
              powerUp.type,
            ),
          );
        }
      }
    }

    enemy.active = false;
  }

  /**
   * 玩家受击规则（对照原作）：
   * - 导弹命中：有任意强化则清空全部强化，否则死亡
   * - 普通命中：有护盾扣 1 层；否则有强化清空强化；否则死亡
   */
  handlePlayerHit(enemy) {
    if (!this.tank) return;

    if (enemy.config.isMissile) {
      if (this.tank.hasAnyPowerUp()) {
        this.tank.shieldCount = 0;
        this.tank.clearPowerUps();
      } else {
        this.tankDie();
      }
      return;
    }

    if (this.tank.shieldCount > 0) {
      this.tank.shieldCount -= 1;
    } else if (this.tank.hasAnyPowerUp()) {
      this.tank.clearPowerUps();
    } else {
      this.tankDie();
    }
  }

  /** 死亡：保存最高分、分数归零、波次回退、坦克复位 */
  tankDie() {
    this.saveHighScore();

    this.currentScore = 0;
    this.currentWave = 1;
    this.currentWaveConfig = WAVES[0];
    this.enemySpawnInterval = WAVES[0].spawnInterval;
    this.missileSpawnInterval = MISSILE_SPAWN.initialInterval;
    this.lastMissileSpawnTime = 0;
    this.waveNotification = new WaveNotification(WAVES[0].name, isTouchDevice());

    if (this.tank) {
      this.explosions.push(
        new Explosion(this.tank.x + this.tank.width / 2, this.tank.y + this.tank.height / 2),
      );
      this.tank.reset();
      this.gameStartTime = performance.now();
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    const bounds = this.bounds;
    // 逻辑坐标系为 CSS 像素；用 setTransform 抵消 DPR 缩放后再清屏
    const dpr = window.devicePixelRatio || 1;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, bounds.width, bounds.height);

    const now = performance.now();
    const showGameStart =
      this.gameStartTime > 0 &&
      now - this.gameStartTime < RUNTIME.showGameStartDuration;

    if (this.tank) {
      this.tank.render(this.ctx, this.imageLoader, showGameStart);
      // 当前分数贴在坦克右侧（对照原作）
      this.ctx.save();
      this.ctx.font = "14px 'Press Start 2P', monospace";
      this.ctx.fillStyle = COLORS.primary;
      this.ctx.shadowColor = COLORS.primary;
      this.ctx.shadowBlur = 8;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(
        `${this.currentScore}`,
        this.tank.x + this.tank.width + 10,
        this.tank.y + this.tank.height / 2 + 5,
      );
      this.ctx.restore();
    }

    for (const bullet of this.bullets) bullet.render(this.ctx);
    for (const enemy of this.enemies) enemy.render(this.ctx, this.imageLoader);
    for (const explosion of this.explosions) explosion.render(this.ctx, this.imageLoader);
    for (const text of this.powerUpTexts) text.render(this.ctx);
    if (this.waveNotification) this.waveNotification.render(this.ctx, bounds);
  }

  addBullet(bullet) {
    this.bullets.push(bullet);
  }

  syncHud() {
    this.hud?.update({
      score: this.currentScore,
      highScore: this.highScore,
      waveName: this.currentWaveConfig?.name ?? '',
    });
  }

  loadHighScore() {
    try {
      const raw = localStorage.getItem(RUNTIME.highScoreStorageKey);
      this.highScore = raw ? Number(raw) || 0 : 0;
    } catch {
      this.highScore = 0;
    }
  }

  saveHighScore() {
    if (this.currentScore <= this.highScore) return;
    this.highScore = this.currentScore;
    try {
      localStorage.setItem(RUNTIME.highScoreStorageKey, String(this.highScore));
    } catch {
      /* 存储不可用时忽略 */
    }
    // 与原作同名事件，便于宿主页面同步到账号
    window.dispatchEvent(
      new CustomEvent('tank-score-updated', { detail: { newScore: this.highScore } }),
    );
    this.onHighScoreChange?.(this.highScore);
  }

  getHighScore() {
    return this.highScore;
  }
}

/** AABB 碰撞（对照 isColliding） */
export function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
