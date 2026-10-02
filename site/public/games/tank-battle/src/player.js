/**
 * player.js —— 玩家坦克。
 * 对照原作 class IS：底部出生、自动开火、四种强化叠加、受击优先扣盾。
 */
import { PLAYER, COLORS, POWER_UP_TEXT } from './config.js';
import { createBullets } from './bullet.js';
import { drawPlayerFallback } from './assets.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.initialX = x;
    this.initialY = y;

    this.width = PLAYER.width;
    this.height = PLAYER.height;

    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.speed = PLAYER.speed;
    this.lastFireTime = 0;

    // 强化状态
    this.shieldCount = 0;
    this.bulletSpeed = PLAYER.bulletSpeed;
    this.bulletCount = PLAYER.bulletCount;
    this.fireRateLevel = 0;

    /** 本次开火产生的子弹，由 Game 收集（避免 Player 直接依赖全局单例） */
    this.pendingBullets = [];
  }

  /** 当前开火间隔：baseFireInterval - 等级*step，下限 minFireInterval */
  get fireInterval() {
    return Math.max(
      PLAYER.minFireInterval,
      PLAYER.baseFireInterval - this.fireRateLevel * PLAYER.fireRateStep,
    );
  }

  /** 是否持有任意强化（受击时决定是清空强化还是死亡） */
  hasAnyPowerUp() {
    return (
      this.shieldCount > 0 ||
      this.fireRateLevel > 0 ||
      this.bulletCount > 1 ||
      this.bulletSpeed > PLAYER.bulletSpeed
    );
  }

  update(dt) {
    // 自动开火
    this.lastFireTime += dt;
    if (this.lastFireTime >= this.fireInterval) {
      this.fire();
      this.lastFireTime = 0;
    }
  }

  fire() {
    this.pendingBullets.push(
      ...createBullets(this, this.bulletSpeed, this.bulletCount),
    );
  }

  /** 取出并清空待发射子弹 */
  drainBullets() {
    if (this.pendingBullets.length === 0) return [];
    const drained = this.pendingBullets;
    this.pendingBullets = [];
    return drained;
  }

  /** 拾取强化（对照原作 applyPowerUp） */
  applyPowerUp(powerUp) {
    switch (powerUp.type) {
      case 'shield':
        if (this.shieldCount < PLAYER.maxShieldCount) this.shieldCount += 1;
        return POWER_UP_TEXT.shield;
      case 'bulletSpeed':
        this.bulletSpeed = Math.min(
          this.bulletSpeed + PLAYER.bulletSpeedStep,
          PLAYER.maxBulletSpeed,
        );
        return POWER_UP_TEXT.bulletSpeed;
      case 'multiShot':
        if (this.bulletCount < PLAYER.maxBulletCount) this.bulletCount += 1;
        return POWER_UP_TEXT.multiShot;
      case 'fireRate':
        if (this.fireRateLevel < PLAYER.maxFireRateLevel) this.fireRateLevel += 1;
        return POWER_UP_TEXT.fireRate;
      default:
        return null;
    }
  }

  /** 清空强化但保留护盾（对照 clearPowerUps） */
  clearPowerUps() {
    this.bulletSpeed = PLAYER.bulletSpeed;
    this.bulletCount = PLAYER.bulletCount;
    this.fireRateLevel = 0;
  }

  /** 清空全部强化（对照 clearAllPowerUps） */
  clearAllPowerUps() {
    this.shieldCount = 0;
    this.clearPowerUps();
  }

  /** 死亡或关闭游戏时复位 */
  reset() {
    this.x = this.initialX;
    this.y = this.initialY;
    this.isDragging = false;
    this.lastFireTime = 0;
    this.pendingBullets = [];
    this.clearAllPowerUps();
  }

  /** 方向键移动，限制在窗口内（对照 moveByKeyboard） */
  moveByKeyboard(direction, dt, bounds) {
    const distance = this.speed * (dt / 1000);
    switch (direction) {
      case 'up':
        this.y = Math.max(0, this.y - distance);
        break;
      case 'down':
        this.y = Math.min(bounds.height - this.height, this.y + distance);
        break;
      case 'left':
        this.x = Math.max(0, this.x - distance);
        break;
      case 'right':
        this.x = Math.min(bounds.width - this.width, this.x + distance);
        break;
      default:
        break;
    }
  }

  contains(px, py, padding = 0) {
    return (
      px >= this.x - padding &&
      px <= this.x + this.width + padding &&
      py >= this.y - padding &&
      py <= this.y + this.height + padding
    );
  }

  startDrag(px, py) {
    this.isDragging = true;
    this.dragOffsetX = px - this.x;
    this.dragOffsetY = py - this.y;
  }

  drag(px, py, bounds) {
    if (!this.isDragging) return;
    this.x = Math.max(0, Math.min(bounds.width - this.width, px - this.dragOffsetX));
    this.y = Math.max(0, Math.min(bounds.height - this.height, py - this.dragOffsetY));
  }

  stopDrag() {
    this.isDragging = false;
  }

  render(ctx, sprites, showGameStart) {
    ctx.save();
    ctx.shadowColor = COLORS.secondary;
    ctx.shadowBlur = 12;

    // 护盾环 + 层数
    if (this.shieldCount > 0) {
      ctx.strokeStyle = COLORS.primary;
      ctx.lineWidth = 3;
      ctx.shadowColor = COLORS.primary;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.primary;
      ctx.font = "bold 14px 'Press Start 2P', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(
        `🛡️${this.shieldCount}`,
        this.x + this.width / 2,
        this.y - 15,
      );
      ctx.shadowColor = COLORS.secondary;
      ctx.shadowBlur = 12;
    }

    // 贴图或兜底方块
    const sprite = sprites?.get('playerTank');
    if (sprite) {
      ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
    } else {
      drawPlayerFallback(ctx, this.x, this.y, this.width, this.height);
    }
    ctx.restore();

    // 开局提示（GAME START）跟随坦克
    if (showGameStart) {
      ctx.save();
      ctx.font = "16px 'Press Start 2P', monospace";
      ctx.fillStyle = COLORS.secondary;
      ctx.shadowColor = COLORS.secondary;
      ctx.shadowBlur = 15;
      ctx.textAlign = 'center';
      ctx.fillText('GAME START', this.x + this.width / 2, this.y - 15);
      ctx.restore();
    }
  }
}
