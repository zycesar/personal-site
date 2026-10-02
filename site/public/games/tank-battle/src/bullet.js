/**
 * bullet.js —— 玩家子弹。
 * 对照原作 class q0：以 angle(度) 决定速度分量，-90 为正上方；
 * 多发模式按角度与横向偏移扇形散开。
 */
import { BULLET, COLORS } from './config.js';

export class Bullet {
  constructor(x, y, speed = BULLET.defaultSpeed, angle = BULLET.defaultAngle) {
    this.x = x;
    this.y = y;
    this.width = BULLET.width;
    this.height = BULLET.height;
    this.speed = speed;
    this.angle = angle;
    this.active = true;

    const rad = (angle * Math.PI) / 180;
    this.vx = Math.cos(rad) * speed;
    this.vy = Math.sin(rad) * speed;
  }

  update(dt, bounds) {
    const seconds = dt / 1000;
    this.x += this.vx * seconds;
    this.y += this.vy * seconds;

    // 出界即回收（上方、左右；下方一般不可能到达）
    if (
      this.y < -this.height ||
      this.x < -this.width ||
      this.x > bounds.width
    ) {
      this.active = false;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(((this.angle + 90) * Math.PI) / 180);

    const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
    gradient.addColorStop(0, COLORS.primary);
    gradient.addColorStop(1, COLORS.secondary);
    ctx.fillStyle = gradient;
    ctx.shadowColor = COLORS.primary;
    ctx.shadowBlur = 10;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

/**
 * 依据子弹数量生成扇形弹幕（对照原作 IS.fire）。
 * bulletCount === 1 时正中单发；多发时角度 -90 + i*5，横向偏移 i*8。
 */
export function createBullets(player, bulletSpeed, bulletCount) {
  const bullets = [];
  const centerX = player.x + player.width / 2 - BULLET.width / 2;
  const muzzleY = player.y - 10;

  if (bulletCount === 1) {
    bullets.push(new Bullet(centerX, muzzleY, bulletSpeed));
    return bullets;
  }

  for (let i = 0; i < bulletCount; i++) {
    const offsetIndex = i - (bulletCount - 1) / 2;
    const angle = BULLET.defaultAngle + offsetIndex * BULLET.spreadAngleStep;
    const x = centerX + offsetIndex * BULLET.spreadOffsetStep;
    bullets.push(new Bullet(x, muzzleY, bulletSpeed, angle));
  }

  return bullets;
}
