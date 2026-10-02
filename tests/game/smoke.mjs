/**
 * smoke.mjs —— 无头冒烟测试。
 * 用最小 DOM/Canvas 桩替代浏览器环境，验证核心逻辑可运行且数值正确。
 * 运行：node test/smoke.mjs
 */

// ---------- 浏览器环境桩 ----------
const noop = () => {};

function makeCtx() {
  const ctx = {
    canvas: { width: 1280, height: 720, clientWidth: 1280, clientHeight: 720 },
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    setTransform: noop, clearRect: noop, fillRect: noop, strokeRect: noop,
    beginPath: noop, arc: noop, stroke: noop, fill: noop, fillText: noop,
    drawImage: noop, measureText: (t) => ({ width: String(t).length * 8 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    globalAlpha: 1,
  };
  return ctx;
}

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};

globalThis.performance = globalThis.performance ?? { now: () => Date.now() };

const listeners = new Map();
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener: (type, fn) => listeners.set(type, fn),
  removeEventListener: (type) => listeners.delete(type),
  dispatchEvent: (event) => {
    const fn = listeners.get(event.type);
    if (fn) fn(event);
    return true;
  },
};
// Node 24 起 navigator 是只读 getter，需用 defineProperty 覆盖
Object.defineProperty(globalThis, 'navigator', {
  value: { maxTouchPoints: 0 },
  configurable: true,
  writable: true,
});
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
};

globalThis.document = {
  hidden: false,
  readyState: 'complete',
  addEventListener: noop,
  removeEventListener: noop,
  createElement: (tag) => {
    if (tag !== 'canvas') return {};
    return {
      id: '',
      width: 0,
      height: 0,
      style: { cssText: '' },
      parentNode: null,
      getContext: () => makeCtx(),
    };
  },
  body: { appendChild: noop },
  querySelector: () => null,
};

globalThis.Image = class Image {
  set src(value) {
    this._src = value;
    // 模拟加载失败，走兜底绘制分支
    if (this.onerror) this.onerror();
  }
  get src() {
    return this._src;
  }
};

// ---------- 测试框架 ----------
let passed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function approx(a, b, tolerance = 1e-6) {
  return Math.abs(a - b) <= tolerance;
}

// ---------- 载入模块 ----------
const config = await import('../../site/public/games/tank-battle/src/config.js');
const { Bullet, createBullets } = await import('../../site/public/games/tank-battle/src/bullet.js');
const { Player } = await import('../../site/public/games/tank-battle/src/player.js');
const { pickEnemyType, buildWeightedTypes, spawnEnemy } = await import('../../site/public/games/tank-battle/src/enemy.js');
const { Explosion, PowerUpText, WaveNotification } = await import('../../site/public/games/tank-battle/src/effects.js');
const { Game, isColliding } = await import('../../site/public/games/tank-battle/src/game.js');

console.log('\n[1] 波次表数值');
check('共 13 波', config.WAVES.length === 13, `实际 ${config.WAVES.length}`);
check('第一波门槛 0 / 间隔 2000', config.WAVES[0].scoreThreshold === 0 && config.WAVES[0].spawnInterval === 2000);
check('噩梦波 = 第13波 / 间隔 28', config.WAVES[12].name === '噩梦波' && config.WAVES[12].spawnInterval === 28);
check('地狱波 = 第12波', config.WAVES[11].name === '地狱波');
check('第6波速度倍率 2', config.WAVES[5].speedMultiplier === 2);
check('第7-13波速度倍率 2.1', config.WAVES.slice(6).every((w) => w.speedMultiplier === 2.1));

console.log('\n[2] resolveWave 边界');
check('0 分 -> 第一波', config.resolveWave(0).waveNumber === 1);
check('799 分 -> 第一波', config.resolveWave(799).waveNumber === 1);
check('800 分 -> 第二波', config.resolveWave(800).waveNumber === 2);
check('144999 分 -> 地狱波(第12波)', config.resolveWave(144999).waveNumber === 12);
check('超大分数 -> 停在噩梦波', config.resolveWave(9_999_999).waveNumber === 13);
check('145000 分 -> 噩梦波', config.resolveWave(145000).waveNumber === 13);

console.log('\n[3] 导弹间隔 max(3000, 9000-波次*1000)');
check('开局默认间隔 8000', config.MISSILE_SPAWN.initialInterval === 8000);
check('第2波 -> 7000', config.resolveMissileInterval(2) === 7000);
check('第6波 -> 3000', config.resolveMissileInterval(6) === 3000);
check('第13波钳制在 3000', config.resolveMissileInterval(13) === 3000);

console.log('\n[4] 敌人权重随波次演变');
const w1 = buildWeightedTypes(1, config.WAVES[0]);
const boss1 = w1.find((t) => t.isBoss);
const missile1 = w1.find((t) => t.isMissile);
check('第1波无 Boss', boss1.probability === 0);
check('第1波无导弹', missile1.probability === 0);

const w4 = buildWeightedTypes(4, config.WAVES[3]);
check('第4波 Boss 概率 0.02', approx(w4.find((t) => t.isBoss).probability, 0.02));

const w20 = buildWeightedTypes(20, config.WAVES[12]);
check('高波次 Boss 概率封顶 0.2', approx(w20.find((t) => t.isBoss).probability, 0.2));

const w3 = buildWeightedTypes(3, config.WAVES[2]);
check('第3波导弹概率 0.01', approx(w3.find((t) => t.isMissile).probability, 0.01));

const boxAt1 = w1.filter((t) => t.imageKey === 'resourceBox').map((t) => t.probability);
const w6 = buildWeightedTypes(6, config.WAVES[5]);
const boxAt6 = w6.filter((t) => t.imageKey === 'resourceBox').map((t) => t.probability);
check('资源箱概率随倍率放大', boxAt6[0] > boxAt1[0], `${boxAt1[0]} -> ${boxAt6[0]}`);

console.log('\n[5] 加权抽取总是返回合法类型');
let pickOk = true;
for (let i = 0; i < 500; i++) {
  const t = pickEnemyType(13, config.WAVES[12]);
  if (!t || typeof t.speed !== 'number') pickOk = false;
}
check('500 次抽取均合法', pickOk);
check('random=0 时落在第一个类型', pickEnemyType(1, config.WAVES[0], () => 0).imageKey === 'enemyTank');

console.log('\n[6] 子弹生成几何');
const p = new Player(100, 100);
const single = createBullets(p, 300, 1);
check('单发只有 1 颗', single.length === 1);
check('单发角度 -90', single[0].angle === -90);
check('单发速度分量 vy<0, vx≈0', single[0].vy < 0 && approx(single[0].vx, 0, 1e-9));

const triple = createBullets(p, 300, 3);
check('三连发 3 颗', triple.length === 3);
check('三连发中间角度 -90', triple[1].angle === -90);
check('三连发角度对称', triple[0].angle === -95 && triple[2].angle === -85);
check('三连发横向偏移递增', triple[0].x < triple[1].x && triple[1].x < triple[2].x);

console.log('\n[7] 玩家强化上限');
const q = new Player(0, 0);
check('初始射速间隔 1000', q.fireInterval === 1000);
for (let i = 0; i < 20; i++) q.applyPowerUp({ type: 'fireRate' });
check('射速等级封顶 10', q.fireRateLevel === 10);
check('射速间隔下限 200', q.fireInterval === 200, `实际 ${q.fireInterval}`);

for (let i = 0; i < 20; i++) q.applyPowerUp({ type: 'shield' });
check('护盾封顶 5', q.shieldCount === 5);
for (let i = 0; i < 30; i++) q.applyPowerUp({ type: 'multiShot' });
check('弹数封顶 15', q.bulletCount === 15);
for (let i = 0; i < 40; i++) q.applyPowerUp({ type: 'bulletSpeed' });
check('弹速封顶 900', q.bulletSpeed === 900);

q.clearAllPowerUps();
check('清空强化后回到初始值', q.shieldCount === 0 && q.bulletCount === 1 && q.bulletSpeed === 300 && q.fireRateLevel === 0);
check('清空后 hasAnyPowerUp 为 false', q.hasAnyPowerUp() === false);

console.log('\n[8] 自动开火节奏');
const r = new Player(0, 0);
r.update(999);
check('未到 1000ms 不开火', r.pendingBullets.length === 0);
r.update(1);
check('满 1000ms 开火一次', r.pendingBullets.length === 1);
check('drainBullets 取出后清空', r.drainBullets().length === 1 && r.drainBullets().length === 0);

console.log('\n[9] 键盘移动与边界钳制');
const m = new Player(0, 0);
m.moveByKeyboard('up', 1000, { width: 1280, height: 720 });
check('上边界钳制为 0', m.y === 0);
m.moveByKeyboard('left', 1000, { width: 1280, height: 720 });
check('左边界钳制为 0', m.x === 0);
m.moveByKeyboard('right', 100000, { width: 1280, height: 720 });
check('右边界钳制', m.x === 1280 - 50, `实际 ${m.x}`);
m.moveByKeyboard('down', 100000, { width: 1280, height: 720 });
check('下边界钳制', m.y === 720 - 50, `实际 ${m.y}`);

console.log('\n[10] AABB 碰撞');
check('重叠判定为真', isColliding({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }));
check('相离判定为假', isColliding({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 10, height: 10 }) === false);
check('边贴边判定为假', isColliding({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }) === false);

console.log('\n[11] 受击规则（护盾/清强化/死亡）');
function makeGame() {
  const g = new Game();
  g.tank = new Player(100, 100);
  return g;
}
let g = makeGame();
g.tank.shieldCount = 2;
g.tank.fireRateLevel = 3;
g.handlePlayerHit({ config: { isMissile: false } });
check('普通命中优先扣护盾', g.tank.shieldCount === 1 && g.tank.fireRateLevel === 3);

g = makeGame();
g.tank.fireRateLevel = 3;
g.tank.bulletCount = 2;
g.handlePlayerHit({ config: { isMissile: false } });
check('无护盾时清空强化而不死亡', g.tank.fireRateLevel === 0 && g.tank.bulletCount === 1 && g.currentScore === 0);

g = makeGame();
g.currentScore = 500;
g.handlePlayerHit({ config: { isMissile: false } });
check('无任何强化时死亡并清零分数', g.currentScore === 0 && g.currentWave === 1);

g = makeGame();
g.tank.shieldCount = 3;
g.tank.fireRateLevel = 2;
g.handlePlayerHit({ config: { isMissile: true } });
check('导弹命中清空全部强化（含护盾）', g.tank.shieldCount === 0 && g.tank.fireRateLevel === 0);

g = makeGame();
g.currentScore = 300;
g.handlePlayerHit({ config: { isMissile: true } });
check('导弹命中空强化玩家 -> 死亡', g.currentScore === 0);

console.log('\n[12] 击毁计分与掉落');
g = makeGame();
g.handleEnemyKilled({
  x: 10, y: 10, width: 40, height: 40,
  config: { score: 30, imageKey: 'enemyPlane', powerUp: { type: 'fireRate' } },
});
check('击毁敌机 +30 分', g.currentScore === 30);
check('掉落射速强化已应用', g.tank.fireRateLevel === 1);
check('产生爆炸特效', g.explosions.length === 1);

g = makeGame();
g.handleEnemyKilled({
  x: 10, y: 10, width: 40, height: 40,
  config: { score: 50, imageKey: 'resourceBox', powerUp: { type: 'scoreBonus' } },
});
check('积分箱额外加分 10~100', g.currentScore >= 50 + 10 && g.currentScore <= 50 + 100, `实际 ${g.currentScore}`);
check('产生加分飘字', g.powerUpTexts.length === 1 && g.powerUpTexts[0].text.startsWith('+'));

console.log('\n[13] 完整 update 循环（含刷怪与波次切换）');
g = new Game();
g.tank = new Player(600, 620);
g.hud = null;
let updateError = null;
try {
  for (let i = 0; i < 400; i++) g.update(33.34);
} catch (error) {
  updateError = error;
}
check('400 帧 update 无异常', updateError === null, updateError?.message);
check('已刷出敌人', g.enemies.length > 0, `实际 ${g.enemies.length}`);
check('敌人数不超过上限', g.enemies.length <= config.RUNTIME.maxEnemies);
check('子弹数不超过上限', g.bullets.length <= config.RUNTIME.maxBullets);

// 高分局应自动进入后期波次
g.currentScore = 80000;
g.checkAndUpdateWave();
check('80000 分进入第十一波', g.currentWave === 11 && g.currentWaveConfig.name === '第十一波');
check('切波后刷怪间隔同步为 60', g.enemySpawnInterval === 60);

console.log('\n[14] 渲染路径（含贴图失败兜底）');
const ctx = makeCtx();
const notify = new WaveNotification('第一波', false);
const notifyWave = new WaveNotification('第三波', false);
const boom = new Explosion(100, 100);
const floatText = new PowerUpText(10, 10, 'shield');
let renderError = null;
try {
  g.tank.render(ctx, { get: () => undefined }, true);
  g.enemies.slice(0, 5).forEach((e) => e.render(ctx, { get: () => undefined }));
  boom.render(ctx, { get: () => undefined });
  floatText.render(ctx);
  notify.render(ctx, { width: 1280, height: 720 });
  notifyWave.render(ctx, { width: 1280, height: 720 });
  g.render();
} catch (error) {
  renderError = error;
}
check('兜底渲染无异常', renderError === null, renderError?.message);

console.log('\n[15] 最高分持久化与事件');
g = new Game();
// 清空存储以验证"初始读回"行为（前面的用例已写入过）
localStorage.removeItem(config.RUNTIME.highScoreStorageKey);
g.loadHighScore();
check('空存储时最高分为 0', g.getHighScore() === 0);
g.currentScore = 1234;
let eventScore = null;
window.addEventListener('tank-score-updated', (e) => {
  eventScore = e.detail.newScore;
});
g.saveHighScore();
check('最高分写入 localStorage', localStorage.getItem(config.RUNTIME.highScoreStorageKey) === '1234');
check('派发 tank-score-updated 事件', eventScore === 1234);

const g2 = new Game();
g2.loadHighScore();
check('新实例能读回最高分', g2.getHighScore() === 1234);

g.currentScore = 100;
g.saveHighScore();
check('低分不覆盖最高分', g.getHighScore() === 1234);

console.log('\n[16] 波次横幅时长');
check('首波横幅 3500ms', new WaveNotification('第一波').duration === 3500);
check('普通波横幅 2500ms', new WaveNotification('第二波').duration === 2500);
const firstWave = new WaveNotification('第一波', false);
check('首波标题为 GAME START', firstWave.text === 'GAME START');
check('首波提示桌面操作', firstWave.subText.includes('鼠标拖动'));
check('移动端提示为触摸', new WaveNotification('第一波', true).subText.includes('手指拖动'));
check('普通波标题含"敌人即将来临"', new WaveNotification('第七波').text === '第七波敌人即将来临！');

// ---------- 汇总 ----------
console.log(`\n${'='.repeat(52)}`);
if (failures.length === 0) {
  console.log(`全部通过：${passed} 项断言 ✅`);
  process.exit(0);
} else {
  console.log(`通过 ${passed} 项，失败 ${failures.length} 项 ❌`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
