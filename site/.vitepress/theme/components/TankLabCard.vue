<script setup lang="ts">
import { withBase } from 'vitepress'

withDefaults(defineProps<{ headingLevel?: 'h2' | 'h3' }>(), { headingLevel: 'h3' })
</script>

<template>
  <a class="lab-card" :href="withBase('/lab/tank-battle')">
    <div class="lab-card-art" aria-hidden="true">
      <span>01 / CANVAS</span>
      <img :src="withBase('/games/tank-battle/assets/playerTank.png')" width="112" height="112" loading="lazy" alt="">
      <small>PLAY · EXPLORE · BUILD</small>
    </div>
    <div class="lab-card-copy">
      <p class="lab-card-kicker">浏览器里的小实验</p>
      <component :is="headingLevel">坦克大战 · Canvas 实验</component>
      <p>拖动坦克、拾取强化，挑战 13 波敌人。把输入控制、碰撞检测与动画循环，变成一场可以亲手体验的小冒险。</p>
      <span class="lab-card-action">开始探索 <span aria-hidden="true">→</span></span>
    </div>
  </a>
</template>

<style scoped>
.lab-card { display: grid; grid-template-columns: minmax(220px, .75fr) minmax(0, 1.25fr); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); text-decoration: none; color: var(--text); }
.lab-card:hover { border-color: var(--accent); }
.lab-card-art { display: flex; min-height: 280px; flex-direction: column; align-items: center; justify-content: space-between; padding: 28px; background: radial-gradient(ellipse at center, #383b7755, transparent 80%), #101725; color: #a8afdb; }
.lab-card-art span, .lab-card-art small { font-size: 10px; font-weight: 700; letter-spacing: .15em; }
.lab-card-art img { object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 0 28px #5af5c844); }
.lab-card-copy { align-self: center; padding: clamp(24px, 4vw, 48px); }
.lab-card .lab-card-kicker { color: var(--accent); font-size: 12px; font-weight: 700; }
.lab-card :is(h2, h3) { margin: 12px 0; padding: 0; border: 0; font-size: clamp(23px, 3vw, 32px); line-height: 1.35; }
.lab-card-copy p { margin: 0; color: var(--muted); font-size: 15px; line-height: 1.85; }
.lab-card-action { display: inline-block; margin-top: 24px; color: var(--accent); font-size: 14px; font-weight: 750; }
@media (max-width: 600px) {
  .lab-card { grid-template-columns: 1fr; }
  .lab-card-art { min-height: 230px; padding: 22px; }
}
</style>
