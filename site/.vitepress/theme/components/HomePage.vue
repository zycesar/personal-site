<script setup lang="ts">
import { profile } from '../../../data/profile'

const projects = [
  {
    title: '业务系统重构',
    description: '用于演示项目案例写法的结构样例，不代表真实工作经历。',
    href: '/projects/product-rebuild',
    tags: ['Vue', 'TypeScript', '工程化'],
  },
  {
    title: '全栈学习实验室',
    description: '用于记录前端向服务端延伸的学习型项目结构样例。',
    href: '/projects/fullstack-lab',
    tags: ['Vue', 'Node.js', 'Database'],
  },
]

const posts = [
  {
    title: '从业务问题出发，而不是从技术方案出发',
    description: '在选择框架和模式前，先把目标、约束与验证方式说清楚。',
    href: '/posts/problem-before-technology',
  },
  {
    title: '从前端走向全栈：我的能力地图',
    description: '把服务端、数据与部署拆成可执行的学习路径。',
    href: '/posts/fullstack-roadmap',
  },
  {
    title: '构建可维护 Vue 组件时，我在关注什么',
    description: '用清晰边界、稳定接口和可验证状态降低组件维护成本。',
    href: '/posts/maintainable-vue-components',
  },
]
</script>

<template>
  <div class="home-page">
    <section class="hero shell" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow">HELLO，我是王永忠</p>
        <h1 id="hero-title">我为 Web 构建 <em>好用的体验。</em></h1>
        <p class="hero-intro">{{ profile.intro }}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="/projects/">查看项目</a>
          <a class="button button-secondary" href="/posts/">阅读文章</a>
        </div>
      </div>
      <img class="brand-mark" :src="'/brand.svg'" width="320" height="320" alt="永字品牌图形">
    </section>

    <section class="home-section shell" aria-labelledby="projects-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">实践与探索</p>
          <h2 id="projects-title">精选项目</h2>
        </div>
        <a href="/projects/">查看全部 <span aria-hidden="true">→</span></a>
      </div>
      <div class="project-grid">
        <a v-for="project in projects" :key="project.href" class="card project-card" :href="project.href">
          <span class="example-pill" data-example="project">示例项目</span>
          <h3>{{ project.title }}</h3>
          <p>{{ project.description }}</p>
          <ul class="tag-list" aria-label="技术标签">
            <li v-for="tag in project.tags" :key="tag">{{ tag }}</li>
          </ul>
        </a>
      </div>
    </section>

    <section class="home-section shell" aria-labelledby="posts-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">思考与记录</p>
          <h2 id="posts-title">最新文章</h2>
        </div>
        <a href="/posts/">浏览文章 <span aria-hidden="true">→</span></a>
      </div>
      <div class="post-grid">
        <a v-for="post in posts" :key="post.href" class="card post-card" :href="post.href">
          <span class="example-pill" data-example="post">示例文章</span>
          <h3>{{ post.title }}</h3>
          <p>{{ post.description }}</p>
          <span class="read-more">阅读文章 <span aria-hidden="true">→</span></span>
        </a>
      </div>
    </section>

    <section class="journey home-section shell" aria-labelledby="journey-title">
      <div>
        <p class="eyebrow">持续学习</p>
        <h2 id="journey-title">成长路径</h2>
        <p class="journey-lead">不只展示结果，也记录成长过程。</p>
      </div>
      <ol>
        <li v-for="(step, index) in profile.journey" :key="step">
          <span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ step }}</strong>
        </li>
      </ol>
    </section>

    <section v-if="profile.links.length" class="contact home-section shell" aria-labelledby="contact-title">
      <h2 id="contact-title">一起聊聊</h2>
      <div>
        <a v-for="link in profile.links" :key="link.href" :href="link.href" target="_blank" rel="noreferrer">
          {{ link.label }}
        </a>
      </div>
    </section>
  </div>
</template>
