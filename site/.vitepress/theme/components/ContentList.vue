<script setup lang="ts">
import { computed } from 'vue'

import { data as allPosts } from '../../../posts/posts.data'
import { data as allProjects } from '../../../projects/projects.data'
import ContentCard from './ContentCard.vue'

const props = defineProps<{ kind: 'projects' | 'posts' }>()

const heading = computed(() => props.kind === 'projects' ? '项目' : '文章')
const intro = computed(() => props.kind === 'projects'
  ? '项目案例与实践记录。'
  : '前端、工程化与全栈学习记录。')
const items = computed(() => props.kind === 'projects' ? allProjects : allPosts)
</script>

<template>
  <section class="content-list home-section shell" :aria-labelledby="`${kind}-title`">
    <h1 :id="`${kind}-title`">{{ heading }}</h1>
    <p class="content-list-intro">{{ intro }}</p>
    <div v-if="items.length" :class="kind === 'projects' ? 'project-grid' : 'post-grid'">
      <ContentCard
        v-for="item in items"
        :key="item.url"
        :class="kind === 'projects' ? 'project-card' : 'post-card'"
        :url="item.url"
        :title="item.frontmatter.title"
        :description="item.frontmatter.description"
        :date="item.frontmatter.date"
        :tags="item.frontmatter.tags"
        :example-label="kind === 'projects' ? item.frontmatter.exampleLabel : undefined"
      />
    </div>
    <p v-else>内容正在准备中。</p>
  </section>
</template>
