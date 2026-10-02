<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

import { profile } from '../../../data/profile'
import { data as allPosts } from '../../../posts/posts.data'
import { data as allProjects } from '../../../projects/projects.data'
import ContentCard from './ContentCard.vue'
import TankLabCard from './TankLabCard.vue'

const projects = computed(() => allProjects.filter(({ frontmatter }) => frontmatter.featured).slice(0, 3))
const posts = computed(() => allPosts.slice(0, 3))
</script>

<template>
  <div class="home-page">
    <section class="hero shell" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow">HELLO，我是{{ profile.name }}</p>
        <p class="hero-role">{{ profile.role }}</p>
        <h1 id="hero-title">{{ profile.headline }} <em>{{ profile.emphasis }}</em></h1>
        <p class="hero-intro">{{ profile.intro }}</p>
        <div class="hero-actions">
          <a class="button button-primary" :href="withBase('/posts/')">阅读文章</a>
          <a class="button button-secondary" :href="withBase('/projects/')">查看项目</a>
        </div>
      </div>
      <img class="brand-mark" :src="withBase('/brand.svg')" width="320" height="320" alt="永字品牌图形">
    </section>

    <section class="home-section shell" aria-labelledby="projects-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">实践与探索</p>
          <h2 id="projects-title">精选项目</h2>
        </div>
        <a :href="withBase('/projects/')">查看全部 <span aria-hidden="true">→</span></a>
      </div>
      <div class="project-grid">
        <ContentCard
          v-for="project in projects"
          :key="project.url"
          class="project-card"
          :url="project.url"
          :title="project.frontmatter.title"
          :description="project.frontmatter.description"
          :date="project.frontmatter.date"
          :tags="project.frontmatter.tags"
          :example-label="project.frontmatter.exampleLabel"
        />
      </div>
    </section>

    <section v-if="posts.length" class="home-section shell" aria-labelledby="posts-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">思考与记录</p>
          <h2 id="posts-title">最新文章</h2>
        </div>
        <a :href="withBase('/posts/')">浏览文章 <span aria-hidden="true">→</span></a>
      </div>
      <div class="post-grid">
        <ContentCard
          v-for="post in posts"
          :key="post.url"
          class="post-card"
          :url="post.url"
          :title="post.frontmatter.title"
          :description="post.frontmatter.description"
          :date="post.frontmatter.date"
          :tags="post.frontmatter.tags"
        />
      </div>
    </section>

    <section class="home-section shell" aria-labelledby="lab-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">动手试一试</p>
          <h2 id="lab-title">互动实验</h2>
        </div>
        <a :href="withBase('/lab/')">进入实验室 <span aria-hidden="true">→</span></a>
      </div>
      <TankLabCard />
    </section>

    <section class="journey home-section shell" aria-labelledby="journey-title">
      <div>
        <p class="eyebrow">当前探索</p>
        <h2 id="journey-title">在实践中积累，<br>在探索中深入。</h2>
      </div>
      <ol>
        <li v-for="(step, index) in profile.exploration" :key="step">
          <span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ step }}</strong>
        </li>
      </ol>
    </section>

    <section v-if="profile.links.length" class="contact home-section shell" aria-labelledby="contact-title">
      <h2 id="contact-title">一起聊聊。</h2>
      <div>
        <a v-for="link in profile.links" :key="link.href" :href="link.href" target="_blank" rel="noreferrer">
          {{ link.label }}
        </a>
      </div>
    </section>
  </div>
</template>
