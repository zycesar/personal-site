<script setup lang="ts">
import { Content, useData } from 'vitepress'

import HomePage from './components/HomePage.vue'
import ContentList from './components/ContentList.vue'
import NotFound from './components/NotFound.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'

const { frontmatter, page } = useData()
</script>

<template>
  <a class="skip-link" href="#main">跳到正文</a>
  <SiteHeader />
  <main id="main">
    <NotFound v-if="page.isNotFound" />
    <HomePage v-else-if="frontmatter.layout === 'home'" />
    <ContentList v-else-if="frontmatter.layout === 'projects'" kind="projects" />
    <ContentList v-else-if="frontmatter.layout === 'posts'" kind="posts" />
    <article v-else class="prose shell">
      <Content />
    </article>
  </main>
  <SiteFooter />
</template>
