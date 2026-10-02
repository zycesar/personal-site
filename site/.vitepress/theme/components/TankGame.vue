<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type GameWindow = Window & { __tankGame__?: { destroy: () => void } }

const state = ref<'idle' | 'loading' | 'playing' | 'error'>('idle')
const frame = ref<HTMLIFrameElement>()
const stage = ref<HTMLElement>()
const startButton = ref<HTMLButtonElement>()
let loadingTimeout: ReturnType<typeof setTimeout> | undefined

function releaseGame() {
  clearTimeout(loadingTimeout)
  const gameWindow = frame.value?.contentWindow as GameWindow | null | undefined
  gameWindow?.__tankGame__?.destroy()
}

async function closeGame() {
  releaseGame()
  state.value = 'idle'
  await nextTick()
  startButton.value?.focus({ preventScroll: true })
}

function showError() {
  releaseGame()
  state.value = 'error'
}

async function startGame() {
  if (state.value === 'loading' || state.value === 'playing') return
  state.value = 'loading'
  loadingTimeout = setTimeout(showError, 15000)
  await nextTick()
  stage.value?.scrollIntoView({ block: 'center', behavior: 'instant' })
}

function handleMessage(event: MessageEvent) {
  if (event.origin !== window.location.origin || event.source !== frame.value?.contentWindow) return
  if (event.data?.type === 'tank-game:ready') {
    clearTimeout(loadingTimeout)
    state.value = 'playing'
    frame.value?.focus({ preventScroll: true })
  } else if (event.data?.type === 'tank-game:exit') {
    void closeGame()
  } else if (event.data?.type === 'tank-game:error') {
    showError()
  }
}

onMounted(() => window.addEventListener('message', handleMessage))
onBeforeUnmount(() => {
  releaseGame()
  window.removeEventListener('message', handleMessage)
})
</script>

<template>
  <section class="game-player" aria-label="坦克大战试玩">
    <div ref="stage" class="game-stage" :aria-busy="state === 'loading'">
      <iframe
        v-if="state === 'loading' || state === 'playing'"
        ref="frame"
        :src="withBase('/games/tank-battle/index.html?autostart=1')"
        title="坦克大战游戏画面"
        allow="fullscreen"
        allowfullscreen
        @error="showError"
      />
      <div v-if="state !== 'playing'" class="game-cover">
        <img :src="withBase('/games/tank-battle/assets/playerTank.png')" width="96" height="96" alt="" aria-hidden="true">
        <p class="game-cover-title">准备好迎接下一波了吗？</p>
        <p class="game-cover-copy" role="status">
          {{ state === 'loading' ? '正在加载游戏…' : state === 'error' ? '加载未完成，请检查网络后重试。' : '自动开火 · 13 波挑战 · 本机最高分' }}
        </p>
        <button v-if="state !== 'loading'" ref="startButton" class="button button-primary" type="button" @click="startGame">
          {{ state === 'error' ? '重新加载' : '开始体验' }}
        </button>
      </div>
    </div>
    <div class="game-player-footer">
      <span>电脑使用方向键或拖动；手机按住坦克拖动。</span>
      <button v-if="state === 'loading' || state === 'playing'" type="button" @click="closeGame">
        {{ state === 'loading' ? '取消加载' : '结束试玩' }}
      </button>
      <a v-else :href="withBase('/games/tank-battle/index.html')" target="_blank" rel="noreferrer">独立窗口打开 ↗</a>
    </div>
  </section>
</template>

<style scoped>
.game-player { margin: 32px 0; }
.game-stage {
  position: relative;
  height: clamp(480px, 65vh, 650px);
  overflow: hidden;
  border: 1px solid #334461;
  border-radius: 20px;
  background: #0c111b;
}
iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.game-cover {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 28px;
  background-image: radial-gradient(ellipse at 50% 40%, #5b5ce238, transparent 70%), linear-gradient(#8d9dff0b 1px, transparent 1px), linear-gradient(90deg, #8d9dff0b 1px, transparent 1px);
  background-size: 100% 100%, 32px 32px, 32px 32px;
  text-align: center;
}
.game-cover img { object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 0 24px #54edc340); }
.game-cover .game-cover-title { margin: 8px 0 0; color: #f4f4ff; font-size: clamp(20px, 4vw, 30px); font-weight: 750; }
.game-cover .game-cover-copy { margin: 0; color: #adb8d1; font-size: 14px; }
.game-cover button { cursor: pointer; font: inherit; }
.game-player-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 12px; color: var(--muted); font-size: 13px; }
.game-player-footer button { border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; background: var(--surface); color: var(--text); cursor: pointer; font: inherit; }
@media (max-width: 480px) {
  .game-stage { height: min(640px, 75svh); min-height: 420px; border-radius: 14px; }
  .game-cover { padding: 20px; }
}
</style>
