/**
 * enemy.js —— 敌人 / Boss / 追踪导弹 / 资源箱。
 * 对照原作 class Bd 与 spawnEnemy 的加权随机逻辑。
 */
import {
  ENEMY_TYPES,
  ENEMY_SIZE,
  BOSS_PROBABILITY_PER_WAVE,
  BOSS_PROBABILITY_CAP,
  MISSILE_BASE_PROBABILITY,
  MISSILE_PROBABILITY_PER_WAVE,
  MISSILE_PROBABILITY_CAP,
  COLORS,
  RUNTIME,
} from './config.js';
import { drawEnemyFallback } from './assets.js';

export class Enemy {
  constructor(x, config, targetX, targetY) {
    this.x = x;
    this.config = config;
    this.currentHealth = config.health;
    this.active = true;
    this.hitFlashTime = 0;
    this.glowTime = 0;

    // 体型按类型区分
    let size = ENEMY_SIZE.default;
    if (config.isBoss) size = ENEMY_SIZE.boss;
    else if (config.isMissile) size = ENEMY_SIZE.missile;
    this.width = size.width;
    this.height = size.height;

    // 从顶部上方入场
    this.y = -this.height;

    this.velocityX = 0;
    this.velocityY = 0;
    this.rotation = 0;

    // 导弹朝玩家当前位置直线飞行
    if (config.isMissile && targetX !== undefined && targetY !== undefined) {
      const dx = targetX - x;
      const dy = targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0) {
        this.velocityX = (dx / distance) * config.speed;
        this.velocityY = (dy / distance) * config.speed;
        this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
      }
    }
  }

  update(dt, bounds) {
    const seconds = dt / 1000;

    if (this.config.isMissile) {
      this.x += this.velocityX * seconds;
      this.y += this.velocityY * seconds;
    } else {
      this.y += this.config.speed * seconds;
    }

    if (this.hitFlashTime > 0) this.hitFlashTime -= dt;
    if (this.config.imageKey === 'resourceBox') this.glowTime += dt;

    // 飞出屏幕即回收（含左右越界，覆盖斜飞的导弹）
    if (
      this.y > bounds.height ||
      this.x < -this.width ||
      this.x > bounds.width
    ) {
      this.active = false;
    }
  }

  /** 返回 true 表示本次伤害致死 */
  takeDamage() {
    this.currentHealth -= 1;
    if (this.currentHealth > 0) this.hitFlashTime = RUNTIME.hitFlashDuration;
    return this.currentHealth <= 0;
  }

  render(ctx, sprites) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    ctx.translate(centerX, centerY);
    if (this.hitFlashTime > 0) ctx.globalAlpha = 0.5;

    if (this.config.imageKey === 'resourceBox') {
      // 资源箱呼吸金光
      const pulse = Math.sin(this.glowTime / 300) * 0.5 + 0.5;
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 15 + pulse * 10;
    } else if (this.config.isMissile) {
      ctx.rotate(this.rotation);
      ctx.shadowColor = COLORS.danger;
      ctx.shadowBlur = 6;
    } else if (this.config.isBoss) {
      ctx.rotate(Math.PI);
      ctx.shadowColor = COLORS.boss;
      ctx.shadowBlur = 20;
    } else {
      ctx.rotate(Math.PI);
      ctx.shadowColor = COLORS.danger;
      ctx.shadowBlur = 8;
    }

    const sprite = sprites?.get(this.config.imageKey);
    if (sprite) {
      ctx.drawImage(sprite, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      drawEnemyFallback(ctx, this.width, this.height);
    }
    ctx.restore();

    // 多血量单位显示剩余血量（资源箱除外）
    if (this.config.health > 1 && this.config.imageKey !== 'resourceBox') {
      ctx.save();
      ctx.fillStyle = COLORS.text;
      ctx.font = "12px 'Press Start 2P', monospace";
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText(`${this.currentHealth}`, centerX, this.y + this.height + 15);
      ctx.restore();
    }
  }
}

/**
 * 按当前波次计算每个类型的实际权重（对照spawnEnemy内的 map）。
 * 资源箱权重乘以 resourceBoxMultiplier；Boss/导弹随波次开放。
 */
export function buildWeightedTypes(wave, waveConfig) {
  return ENEMY_TYPES.map((type) => {
    if (type.imageKey === 'resourceBox') {
      return { ...type, probability: type.probability * waveConfig.resourceBoxMultiplier };
    }
    if (type.isBoss) {
      const probability =
        wave >= 4 ? Math.min(BOSS_PROBABILITY_PER_WAVE * (wave - 3), BOSS_PROBABILITY_CAP) : 0;
      return { ...type, probability };
    }
    if (type.isMissile) {
      const probability =
        wave >= 3
          ? Math.min(
              MISSILE_BASE_PROBABILITY + MISSILE_PROBABILITY_PER_WAVE * (wave - 3),
              MISSILE_PROBABILITY_CAP,
            )
          : 0;
      return { ...type, probability };
    }
    return type;
  });
}

/** 归一化后用累积分布抽取一个类型 */
export function pickEnemyType(wave, waveConfig, random = Math.random) {
  const weighted = buildWeightedTypes(wave, waveConfig);
  const total = weighted.reduce((sum, type) => sum + type.probability, 0);
  if (total <= 0) return weighted[0];

  const normalized = weighted.map((type) => ({
    ...type,
    probability: type.probability / total,
  }));

  const roll = random();
  let cumulative = 0;
  for (const type of normalized) {
    cumulative += type.probability;
    if (roll < cumulative) return type;
  }
  return normalized[normalized.length - 1];
}

/** 生成一个敌人（速度乘上波次倍率） */
export function spawnEnemy(bounds, waveConfig, wave, targetPoint, random = Math.random) {
  const width = ENEMY_SIZE.default.width;
  const x = random() * (bounds.width - width);
  const type = pickEnemyType(wave, waveConfig, random);
  const scaled = { ...type, speed: type.speed * waveConfig.speedMultiplier };

  if (type.isMissile && targetPoint) {
    return new Enemy(x, scaled, targetPoint.x, targetPoint.y);
  }
  return new Enemy(x, scaled);
}

/** 独立生成一枚导弹（第2波起按间隔触发） */
export function spawnMissile(bounds, waveConfig, targetPoint, random = Math.random) {
  const type = ENEMY_TYPES.find((entry) => entry.isMissile);
  if (!type) return null;

  const width = ENEMY_SIZE.missile.width;
  const x = random() * (bounds.width - width);
  const scaled = { ...type, speed: type.speed * waveConfig.speedMultiplier };
  return new Enemy(x, scaled, targetPoint.x, targetPoint.y);
}
