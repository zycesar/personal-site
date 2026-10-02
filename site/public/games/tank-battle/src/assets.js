/**
 * assets.js —— 图片加载器 + 纯代码兜底绘制。
 * 对照原作 class YS：加载失败不阻塞游戏，渲染时退回几何图形。
 */
import { SPRITE_SOURCES } from './config.js';

export class SpriteLoader {
  constructor() {
    this.images = new Map();
    this.loadedCount = 0;
    this.totalCount = 0;
    this.failed = new Set();
    this.loadingPromise = null;
  }

  /** 并发加载全部贴图；单张失败只记录，不 reject */
  async loadAll() {
    if (this.loadingPromise) return this.loadingPromise;
    const entries = Object.entries(SPRITE_SOURCES);
    this.totalCount = entries.length;

    this.loadingPromise = Promise.all(
      entries.map(
        ([key, url]) =>
          new Promise((resolve) => {
            const img = new Image();
            // 本地同源无需 crossOrigin；保留以兼容外链场景
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              this.images.set(key, img);
              this.loadedCount += 1;
              resolve();
            };
            img.onerror = () => {
              this.failed.add(key);
              resolve();
            };
            img.src = url;
          }),
      ),
    );
    return this.loadingPromise;
  }

  get(key) {
    return this.images.get(key);
  }

  isLoaded() {
    return this.loadedCount === this.totalCount;
  }
}

/**
 * 玩家坦克兜底绘制：青色方块 + 炮管
 */
export function drawPlayerFallback(ctx, x, y, width, height) {
  ctx.fillStyle = '#00E5FF';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = '#33EFFF';
  ctx.fillRect(x + 15, y - 10, 20, 15);
}

/**
 * 红色方块兜底（敌人 / 导弹 / 资源箱通用）
 */
export function drawEnemyFallback(ctx, width, height) {
  ctx.fillStyle = '#FF3355';
  ctx.fillRect(-width / 2, -height / 2, width, height);
}

/**
 * 爆炸兜底绘制：金色 + 品红双圆环
 */
export function drawExplosionFallback(ctx, radius) {
  ctx.strokeStyle = '#FFC107';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#FFC107';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#FF00FF';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#FF00FF';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
  ctx.stroke();
}
