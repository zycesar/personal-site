/**
 * config.js —— 全部数值均从 wwenj.com 线上包逆向提取，保持与原作一致。
 * 原始符号对照：Es -> WAVES, V0 -> ENEMY_TYPES, qS -> SPRITE_SOURCES, IS -> 玩家常量。
 */

/** 图片资源（本地 assets/，离线可用） */
export const SPRITE_SOURCES = {
  playerTank: 'assets/playerTank.png',
  enemyTank: 'assets/enemyTank.png',
  enemyPlane: 'assets/enemyPlane.png',
  resourceBox: 'assets/resourceBox.png',
  missile: 'assets/missile.png',
  explosion: 'assets/explosion.png',
};

/**
 * 13 个波次。scoreThreshold 为累计分数门槛，达到即切波。
 * speedMultiplier 同时作用于普通敌人与导弹；spawnInterval 为刷怪间隔(ms)；
 * resourceBoxMultiplier 会按比例缩放所有资源箱的出现概率。
 */
export const WAVES = [
  { waveNumber: 1,  scoreThreshold: 0,      speedMultiplier: 1,   spawnInterval: 2000, resourceBoxMultiplier: 0.5, name: '第一波' },
  { waveNumber: 2,  scoreThreshold: 800,    speedMultiplier: 1.2, spawnInterval: 1600, resourceBoxMultiplier: 0.6, name: '第二波' },
  { waveNumber: 3,  scoreThreshold: 2000,   speedMultiplier: 1.4, spawnInterval: 1200, resourceBoxMultiplier: 0.7, name: '第三波' },
  { waveNumber: 4,  scoreThreshold: 4000,   speedMultiplier: 1.6, spawnInterval: 900,  resourceBoxMultiplier: 0.8, name: '第四波' },
  { waveNumber: 5,  scoreThreshold: 7000,   speedMultiplier: 1.8, spawnInterval: 650,  resourceBoxMultiplier: 0.9, name: '第五波' },
  { waveNumber: 6,  scoreThreshold: 12000,  speedMultiplier: 2,   spawnInterval: 450,  resourceBoxMultiplier: 1,   name: '第六波' },
  { waveNumber: 7,  scoreThreshold: 19000,  speedMultiplier: 2.1, spawnInterval: 300,  resourceBoxMultiplier: 1,   name: '第七波' },
  { waveNumber: 8,  scoreThreshold: 28000,  speedMultiplier: 2.1, spawnInterval: 200,  resourceBoxMultiplier: 1,   name: '第八波' },
  { waveNumber: 9,  scoreThreshold: 40000,  speedMultiplier: 2.1, spawnInterval: 140,  resourceBoxMultiplier: 1,   name: '第九波' },
  { waveNumber: 10, scoreThreshold: 56000,  speedMultiplier: 2.1, spawnInterval: 90,   resourceBoxMultiplier: 1,   name: '第十波' },
  { waveNumber: 11, scoreThreshold: 77000,  speedMultiplier: 2.1, spawnInterval: 60,   resourceBoxMultiplier: 1,   name: '第十一波' },
  { waveNumber: 12, scoreThreshold: 105000, speedMultiplier: 2.1, spawnInterval: 40,   resourceBoxMultiplier: 1,   name: '地狱波' },
  { waveNumber: 13, scoreThreshold: 145000, speedMultiplier: 2.1, spawnInterval: 28,   resourceBoxMultiplier: 1,   name: '噩梦波' },
];

/**
 * 敌人 / 掉落物类型表。
 * probability 为基础权重（会先按波次的 resourceBoxMultiplier 缩放，再归一化）；
 * isBoss 与 isMissile 的权重在 spawnEnemy 中按当前波次动态计算。
 */
export const ENEMY_TYPES = [
  {
    imageKey: 'enemyTank',
    health: 1,
    probability: 0.5,
    speed: 100,
    score: 10,
  },
  {
    imageKey: 'enemyPlane',
    health: 2,
    probability: 0.3,
    speed: 150,
    score: 30,
    powerUp: { type: 'fireRate', value: 0.8, icon: '⚡' },
  },
  {
    imageKey: 'enemyPlane',
    health: 4,
    probability: 0,
    speed: 120,
    score: 100,
    powerUp: { type: 'multiShot', value: 3, icon: '💥' },
    isBoss: true,
  },
  {
    imageKey: 'missile',
    health: 1,
    probability: 0,
    speed: 350,
    score: 200,
    isMissile: true,
  },
  {
    imageKey: 'resourceBox',
    health: 1,
    probability: 0.08,
    speed: 60,
    score: 50,
    powerUp: { type: 'scoreBonus', value: 0, icon: '💰' },
  },
  {
    imageKey: 'resourceBox',
    health: 1,
    probability: 0.06,
    speed: 60,
    score: 200,
    powerUp: { type: 'shield', value: 1, icon: '🛡️' },
  },
  {
    imageKey: 'resourceBox',
    health: 1,
    probability: 0.04,
    speed: 60,
    score: 50,
    powerUp: { type: 'bulletSpeed', value: 1.5, icon: '🚀' },
  },
  {
    imageKey: 'resourceBox',
    health: 1,
    probability: 0.02,
    speed: 60,
    score: 100,
    powerUp: { type: 'multiShot', value: 3, icon: '💥' },
  },
];

/** Boss / 导弹权重随波次变化（isBoss 第4波起，isMissile 第3波起） */
export const BOSS_PROBABILITY_PER_WAVE = 0.02;
export const BOSS_PROBABILITY_CAP = 0.2;
export const MISSILE_BASE_PROBABILITY = 0.01;
export const MISSILE_PROBABILITY_PER_WAVE = 0.005;
export const MISSILE_PROBABILITY_CAP = 0.05;

/** 玩家坦克常量（对照原作 class IS） */
export const PLAYER = {
  width: 50,
  height: 50,
  speed: 200,               // px/s
  baseFireInterval: 1000,   // ms，自动开火
  minFireInterval: 200,     // 射速上限对应的间隔
  fireRateStep: 80,         // 每级射速减少的间隔
  maxFireRateLevel: 10,
  bulletSpeed: 300,
  bulletSpeedStep: 50,
  maxBulletSpeed: 900,
  bulletCount: 1,
  maxBulletCount: 15,
  maxShieldCount: 5,
  spawnBottomOffset: 100,   // 距底部距离
};

/** 子弹常量（对照原作 class q0） */
export const BULLET = {
  width: 5,
  height: 15,
  defaultSpeed: 300,
  defaultAngle: -90,        // 朝上
  spreadAngleStep: 5,       // 多发散射角度步长
  spreadOffsetStep: 8,      // 多发横向偏移步长
};

/** 敌人体型（对照原作 class Bd） */
export const ENEMY_SIZE = {
  default: { width: 40, height: 40 },
  boss: { width: 80, height: 80 },
  missile: { width: 60, height: 90 },
};

/**
 * 导弹生成间隔：max(3000, 9000 - 波次*1000)
 * 注意原作两处不同：开局/复位时用固定 8000，切波时用上面的公式（基数是 9000）。
 */
export const MISSILE_SPAWN = {
  initialInterval: 8000,
  formulaBase: 9000,
  minInterval: 3000,
  reducePerWave: 1000,
};

/** 资源箱额外积分（scoreBonus 掉落时随机 +10~100） */
export const SCORE_BONUS_MIN = 10;
export const SCORE_BONUS_RANGE = 91;

/** 主循环与容量限制（原作锁定 30FPS） */
export const RUNTIME = {
  targetFPS: 30,
  maxEnemies: 50,
  maxBullets: 100,
  showGameStartDuration: 3000,
  waveNotificationInterval: 2500,
  startNotificationDuration: 3500,
  explosionDuration: 500,
  powerUpTextDuration: 2000,
  hitFlashDuration: 200,
  highScoreStorageKey: 'tank-battle.high-score',
};

/** 霓虹配色 */
export const COLORS = {
  primary: '#00E5FF',
  secondary: '#00FF9D',
  danger: '#FF3355',
  boss: '#FF00FF',
  gold: '#FFC107',
  text: '#E6E6E6',
  dim: '#A6A6A6',
};

/** 强化类型 -> 飘字文案（对照原作 class Y0） */
export const POWER_UP_TEXT = {
  bulletSpeed: '+ 速度',
  fireRate: '+ 频率',
  multiShot: '+ 炮弹',
  shield: '+ 护盾',
  bulletStyle: '+ 样式',
  scoreBonus: '+ 积分',
};

/** 根据累计分数取当前波次配置（取门槛最高的那个） */
export function resolveWave(score) {
  for (let i = WAVES.length - 1; i >= 0; i--) {
    if (score >= WAVES[i].scoreThreshold) return WAVES[i];
  }
  return WAVES[0];
}

/** 导弹生成间隔随波次收缩 */
export function resolveMissileInterval(waveNumber) {
  return Math.max(
    MISSILE_SPAWN.minInterval,
    MISSILE_SPAWN.formulaBase - waveNumber * MISSILE_SPAWN.reducePerWave,
  );
}
