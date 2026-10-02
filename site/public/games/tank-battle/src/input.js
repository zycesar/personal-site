/**
 * input.js —— 统一输入层：鼠标拖拽 / 方向键 / 触摸拖拽 / 页面可见性。
 * 对照原作 GS.bindEvents 与各 handle* 方法。
 */
const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const TOUCH_HIT_PADDING = 20;

/** 触摸设备检测（对照 Db） */
export function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || window.matchMedia?.('(pointer: coarse)').matches === true;
}

export class InputController {
  /**
   * @param {object} options
   * @param {HTMLCanvasElement} options.canvas
   * @param {() => object} options.getPlayer  取得玩家实例
   * @param {() => {width:number,height:number}} options.getBounds
   * @param {(visible:boolean) => void} [options.onVisibilityChange]
   */
  constructor({ canvas, getPlayer, getBounds, onVisibilityChange }) {
    this.canvas = canvas;
    this.getPlayer = getPlayer;
    this.getBounds = getBounds;
    this.onVisibilityChange = onVisibilityChange;

    this.mouseX = 0;
    this.mouseY = 0;
    this.keysPressed = new Set();
    this.isMobile = isTouchDevice();
    this.activeTouchId = null;
  }

  bind() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  unbind() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchcancel', this.handleTouchEnd);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  handleResize = () => {
    if (this.onResize) this.onResize();
  };

  handleVisibilityChange = () => {
    if (this.onVisibilityChange) this.onVisibilityChange(!document.hidden);
  };

  handleMouseMove = (event) => {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;

    const player = this.getPlayer();
    if (!player) return;

    player.drag(this.mouseX, this.mouseY, this.getBounds());

    // 悬停到坦克上时切换光标与可点击状态
    if (!this.isMobile && this.canvas) {
      if (player.contains(this.mouseX, this.mouseY) || player.isDragging) {
        this.canvas.style.pointerEvents = 'auto';
        this.canvas.style.cursor = 'move';
      } else {
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.cursor = 'default';
      }
    }
  };

  handleMouseDown = (event) => {
    if (event.target instanceof Element && event.target.closest('button, a, input')) return;
    const player = this.getPlayer();
    if (!player) return;
    if (player.contains(event.clientX, event.clientY)) {
      event.preventDefault();
      player.startDrag(event.clientX, event.clientY);
    }
  };

  handleMouseUp = () => {
    const player = this.getPlayer();
    if (player) player.stopDrag();
  };

  handleKeyDown = (event) => {
    if (ARROW_KEYS.includes(event.key)) {
      event.preventDefault();
      this.keysPressed.add(event.key);
    }
  };

  handleKeyUp = (event) => {
    this.keysPressed.delete(event.key);
  };

  getTouchPos(touch) {
    return { x: touch.clientX, y: touch.clientY };
  }

  handleTouchStart = (event) => {
    if (event.target instanceof Element && event.target.closest('button, a, input')) return;
    const player = this.getPlayer();
    if (!player) return;

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const pos = this.getTouchPos(touch);
      if (
        player.contains(pos.x, pos.y, TOUCH_HIT_PADDING) &&
        this.activeTouchId === null
      ) {
        event.preventDefault();
        this.activeTouchId = touch.identifier;
        player.startDrag(pos.x, pos.y);
        return;
      }
    }
  };

  handleTouchMove = (event) => {
    const player = this.getPlayer();
    if (!player || this.activeTouchId === null) return;

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch.identifier === this.activeTouchId) {
        event.preventDefault();
        const pos = this.getTouchPos(touch);
        player.drag(pos.x, pos.y, this.getBounds());
        return;
      }
    }
  };

  handleTouchEnd = (event) => {
    const player = this.getPlayer();
    if (!player || this.activeTouchId === null) return;

    for (let i = 0; i < event.changedTouches.length; i++) {
      if (event.changedTouches[i].identifier === this.activeTouchId) {
        this.activeTouchId = null;
        player.stopDrag();
        return;
      }
    }
  };

  /** 每帧应用键盘移动 */
  applyKeyboardMovement(player, dt) {
    if (!player) return;
    const bounds = this.getBounds();
    if (this.keysPressed.has('ArrowUp')) player.moveByKeyboard('up', dt, bounds);
    if (this.keysPressed.has('ArrowDown')) player.moveByKeyboard('down', dt, bounds);
    if (this.keysPressed.has('ArrowLeft')) player.moveByKeyboard('left', dt, bounds);
    if (this.keysPressed.has('ArrowRight')) player.moveByKeyboard('right', dt, bounds);
  }

  /** 关闭游戏时清空按键，避免残留状态 */
  reset() {
    this.keysPressed.clear();
    this.activeTouchId = null;
    this.getPlayer()?.stopDrag();
  }
}
