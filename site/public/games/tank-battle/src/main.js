import { Game } from './game.js';

const overlay = document.querySelector('[data-overlay]');
const title = document.querySelector('[data-title]');
const description = document.querySelector('[data-description]');
const instructions = document.querySelector('[data-instructions]');
const status = document.querySelector('[data-status]');
const play = document.querySelector('[data-play]');
const pause = document.querySelector('[data-pause]');
const restart = document.querySelector('[data-restart]');
const fullscreen = document.querySelector('[data-fullscreen]');
const hudRoot = document.querySelector('[data-hud-root]');
const embedded = window.parent !== window;
let loading = false;
let errorMessage = '';

const game = new Game({
  hud: {
    setVisible(visible) { hudRoot.hidden = !visible; },
    update({ score, highScore, waveName }) {
      hudRoot.querySelector('[data-hud="score"]').textContent = String(score);
      hudRoot.querySelector('[data-hud="high-score"]').textContent = String(highScore);
      hudRoot.querySelector('[data-hud="wave"]').textContent = waveName;
    },
  },
  onStateChange: renderState,
});

function renderState() {
  overlay.hidden = game.isRunning && !game.isPaused && !loading;
  pause.hidden = !game.isRunning;
  restart.hidden = !game.isRunning;
  fullscreen.hidden = !game.isRunning || !document.fullscreenEnabled;
  pause.textContent = game.isPaused ? '继续' : '暂停';
  play.disabled = loading;
  restart.disabled = loading;
  title.textContent = loading ? '正在准备战场' : game.isPaused ? '游戏已暂停' : '坦克大战';
  description.textContent = game.isPaused
    ? '当前进度已保留，准备好后继续挑战。'
    : '自动开火，专注走位。看看你能抵御多少波敌人。';
  instructions.hidden = loading || game.isPaused;
  play.textContent = loading ? '正在加载…' : game.isPaused ? '继续游戏' : errorMessage ? '重试' : '开始游戏';
  status.textContent = errorMessage;
}

async function start() {
  if (loading) return;
  loading = true;
  errorMessage = '';
  renderState();
  try {
    await game.start();
    if (embedded && game.isRunning) window.parent.postMessage({ type: 'tank-game:ready' }, window.location.origin);
  } catch (error) {
    errorMessage = error.message || '游戏加载失败，请重试。';
    if (embedded) window.parent.postMessage({ type: 'tank-game:error' }, window.location.origin);
  } finally {
    loading = false;
    renderState();
  }
}

play.addEventListener('click', () => game.isPaused ? game.resume() : start());
pause.addEventListener('click', () => game.isPaused ? game.resume() : game.pause());
restart.addEventListener('click', () => {
  game.stop();
  start();
});
document.querySelector('[data-exit]').addEventListener('click', () => {
  game.destroy();
  if (embedded) window.parent.postMessage({ type: 'tank-game:exit' }, window.location.origin);
  else window.location.assign(new URL('../../lab/tank-battle', window.location.href));
});
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    game.pause();
    errorMessage = '当前浏览器未开启全屏，可以继续在页面中游玩。';
    renderState();
  }
});
document.addEventListener('fullscreenchange', () => {
  fullscreen.textContent = document.fullscreenElement ? '退出全屏' : '全屏';
});
window.addEventListener('blur', () => game.pause());
window.addEventListener('pagehide', () => game.destroy());
window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !game.isRunning) return;
  event.preventDefault();
  game.pause();
});

window.__tankGame__ = {
  start,
  stop: () => game.stop(),
  destroy: () => game.destroy(),
  pause: () => game.pause(),
  resume: () => game.resume(),
  getHighScore: () => game.getHighScore(),
  get instance() { return game; },
};

game.loadHighScore();
renderState();
if (new URLSearchParams(window.location.search).get('autostart') === '1') start();
