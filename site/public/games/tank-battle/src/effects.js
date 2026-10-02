/**
 * effects.js —— 爆炸、强化飘字、波次横幅。
 * 对照原作 class Pd / Y0 / Hd。
 */
import { COLORS, RUNTIME, POWER_UP_TEXT } from './config.js';
import { drawExplosionFallback } from './assets.js';

/** 爆炸：半径扩散 + 渐隐 */
export class Explosion {
  constructor(x, y) {
    this.width = 60;
    this.height = 60;
    this.x = x - 30;
    this.y = y - 30;
    this.radius = 0;
    this.maxRadius = 50;
    this.alpha = 1;
    this.active = true;
    this.duration = RUNTIME.explosionDuration;
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += dt;
    const progress = this.elapsed / this.duration;
    this.radius = this.maxRadius * progress;
    this.alpha = 1 - progress;
    if (this.elapsed >= this.duration) this.active = false;
  }

  render(ctx, sprites) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    const sprite = sprites?.get('explosion');
    if (sprite) {
      ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
    } else {
      ctx.translate(this.x + 30, this.y + 30);
      drawExplosionFallback(ctx, this.radius);
    }
    ctx.restore();
  }
}

/** 强化飘字：向上飘 50px 并渐隐 */
export class PowerUpText {
  constructor(x, y, type, text) {
    this.x = x;
    this.y = y;
    this.alpha = 1;
    this.active = true;
    this.duration = RUNTIME.powerUpTextDuration;
    this.elapsed = 0;
    this.offsetY = 0;
    this.text = text ?? POWER_UP_TEXT[type] ?? '';
  }

  update(dt) {
    this.elapsed += dt;
    const progress = this.elapsed / this.duration;
    this.offsetY = -progress * 50;
    this.alpha = 1 - progress;
    if (this.elapsed >= this.duration) this.active = false;
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.fillStyle = COLORS.secondary;
    ctx.shadowColor = COLORS.secondary;
    ctx.shadowBlur = 10;
    ctx.textAlign = 'left';
    ctx.fillText(this.text, this.x, this.y + this.offsetY);
    ctx.restore();
  }
}

/**
 * 波次横幅：首波显示操作提示，后续波显示"第N波敌人即将来临！"。
 */
export class WaveNotification {
  constructor(name, isMobile = false) {
    this.isFirstWave = name === '第一波';
    this.alpha = 0;
    this.scale = 0.8;
    this.active = true;
    this.elapsed = 0;
    this.particles = [];

    if (this.isFirstWave) {
      this.text = 'GAME START';
      this.subText = isMobile
        ? '手指拖动坦克移动'
        : '鼠标拖动或键盘方向键控制坦克移动';
      this.duration = RUNTIME.startNotificationDuration;
      this.scale = 0.6;
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: (Math.random() - 0.5) * 600,
          y: (Math.random() - 0.5) * 200,
          alpha: Math.random() * 0.5 + 0.3,
          scale: Math.random() * 0.5 + 0.5,
          speed: Math.random() * 2 + 1,
        });
      }
    } else {
      this.text = `${name}敌人即将来临！`;
      this.subText = '';
      this.duration = RUNTIME.waveNotificationInterval;
    }
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  update(dt) {
    this.elapsed += dt;
    const progress = this.elapsed / this.duration;

    if (this.isFirstWave) {
      if (progress < 0.2) {
        const eased = this.easeOutCubic(progress / 0.2);
        this.alpha = eased;
        this.scale = eased;
      } else if (progress < 0.8) {
        this.alpha = 1;
        this.scale = 1;
      } else {
        const t = (progress - 0.8) / 0.2;
        this.alpha = 1 - t;
        this.scale = 1 - t * 0.1;
      }
      for (const particle of this.particles) {
        particle.y += particle.speed;
      }
    } else if (progress < 0.15) {
      const eased = this.easeOutCubic(progress / 0.15);
      this.alpha = eased;
      this.scale = 0.9 + eased * 0.1;
    } else if (progress < 0.85) {
      this.alpha = 1;
      this.scale = 1;
    } else {
      const t = (progress - 0.85) / 0.15;
      this.alpha = 1 - t;
      this.scale = 1;
    }

    if (this.elapsed >= this.duration) this.active = false;
  }

  render(ctx, bounds) {
    ctx.save();
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;

    ctx.globalAlpha = this.alpha;
    ctx.translate(centerX, centerY);
    ctx.scale(this.scale, this.scale);

    const isNarrow = bounds.width < 600;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    if (this.isFirstWave) {
      const w = isNarrow ? Math.min(bounds.width - 40, 340) : 500;
      const h = isNarrow ? 90 : 120;
      ctx.fillRect(-w / 2, -h / 2, w, h);
    } else {
      const w = isNarrow ? Math.min(bounds.width - 40, 300) : 400;
      const h = isNarrow ? 60 : 80;
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();

    if (this.isFirstWave) this.renderGameStart(ctx, bounds);
    else this.renderWaveAlert(ctx);

    ctx.restore();
  }

  renderGameStart(ctx, bounds) {
    const isNarrow = bounds.width < 600;
    const titleSize = isNarrow ? 36 : 72;
    const subSize = isNarrow ? 13 : 18;
    const titleY = isNarrow ? -12 : -20;
    const subY = isNarrow ? 28 : 45;

    ctx.font = `${titleSize}px 'Press Start 2P', VT323, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textWidth = ctx.measureText(this.text).width;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-textWidth / 2 - 20, -titleSize / 2 + 10, textWidth + 40, titleSize - 10);
    ctx.restore();

    const gradient = ctx.createLinearGradient(-textWidth / 2, 0, textWidth / 2, 0);
    gradient.addColorStop(0, COLORS.primary);
    gradient.addColorStop(0.5, COLORS.secondary);
    gradient.addColorStop(1, COLORS.primary);
    ctx.fillStyle = gradient;
    ctx.fillText(this.text, 0, titleY);

    ctx.font = `${subSize}px VT323, monospace`;
    ctx.fillStyle = COLORS.dim;
    ctx.fillText(this.subText, 0, subY);
  }

  renderWaveAlert(ctx) {
    const size = ctx.canvas.clientWidth < 600 ? 32 : 56;
    ctx.font = `${size}px VT323, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textWidth = ctx.measureText(this.text).width;

    const gradient = ctx.createLinearGradient(-textWidth / 2, 0, textWidth / 2, 0);
    gradient.addColorStop(0, COLORS.danger);
    gradient.addColorStop(0.5, '#FF6B85');
    gradient.addColorStop(1, COLORS.danger);
    ctx.fillStyle = gradient;
    ctx.fillText(this.text, 0, 0);
  }
}
