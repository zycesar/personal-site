# 王永忠个人站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建并发布一个基于 Vue 3、VitePress 和 Markdown 的中文个人站，通过腾讯云上海 COS 临时地址公开访问，并为 `zycesay.cn` 备案后的绑定做好准备。

**Architecture:** VitePress 在构建阶段读取个人配置、项目 Markdown 和文章 Markdown，校验 Frontmatter 后生成静态 HTML/CSS/JS。完全自定义的 Vue 主题负责产品化首页、内容列表、详情布局、主题切换和移动端导航；生产产物上传至上海 COS，浏览器运行时不依赖数据库或内容 API。

**Tech Stack:** Vue 3、VitePress、TypeScript、Zod、原生 CSS、Vitest、Vue Test Utils、Playwright、pnpm、腾讯云 COS（上海 `ap-shanghai`）

---

## 文件结构

```text
.
├─ package.json                         # 脚本与依赖
├─ tsconfig.json                        # TypeScript 与 Vue 类型检查
├─ vitest.config.ts                     # 单元/组件测试环境
├─ playwright.config.ts                 # 桌面与移动端端到端测试
├─ scripts/
│  ├─ check-links.mjs                   # 检查构建产物中的站内链接
│  └─ generate-feed.ts                  # 生成 RSS
├─ site/
│  ├─ .vitepress/
│  │  ├─ config.ts                      # VitePress、SEO、Sitemap、构建钩子
│  │  ├─ data/
│  │  │  ├─ content.ts                  # 内容类型、校验、排序和过滤
│  │  │  └─ content.test.ts             # 内容规则测试
│  │  └─ theme/
│  │     ├─ index.ts                    # 自定义主题入口
│  │     ├─ Layout.vue                  # 全站壳、404 与页面布局分发
│  │     ├─ styles.css                  # 设计令牌、响应式与主题样式
│  │     └─ components/
│  │        ├─ SiteHeader.vue           # 桌面/移动导航
│  │        ├─ SiteFooter.vue           # 联系区域
│  │        ├─ ThemeToggle.vue          # 深浅色模式
│  │        ├─ HomePage.vue             # 首页五段内容
│  │        ├─ ContentCard.vue          # 项目/文章卡片
│  │        ├─ ContentList.vue          # 内容列表
│  │        ├─ NotFound.vue             # 404
│  │        └─ SiteHeader.test.ts        # 导航与主题组件测试
│  ├─ data/profile.ts                   # 姓名、定位、成长路径和公开链接
│  ├─ projects/
│  │  ├─ index.md                       # 项目列表入口
│  │  ├─ product-rebuild.md             # 明确标注的示例项目
│  │  └─ fullstack-lab.md                # 明确标注的示例项目
│  ├─ posts/
│  │  ├─ index.md                       # 文章列表入口
│  │  ├─ problem-before-technology.md   # 示例文章
│  │  ├─ fullstack-roadmap.md            # 示例文章
│  │  └─ maintainable-vue-components.md # 示例文章
│  ├─ public/
│  │  ├─ brand.svg                      # “永”字品牌图形
│  │  ├─ og-default.svg                 # 默认社交分享图
│  ├─ index.md                           # 首页路由
│  ├─ about.md                           # 关于页
├─ tests/e2e/site.spec.ts               # 关键路径、移动端和 404
└─ docs/deployment.md                    # COS 发布和备案后域名切换手册
```

### Task 1: 初始化 Vue 3 + VitePress 工程

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `site/.vitepress/config.ts`
- Create: `site/index.md`

- [ ] **Step 1: 创建依赖和脚本清单**

```json
{
  "name": "wang-yongzhong-personal-site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vitepress dev site",
    "build": "vitepress build site",
    "preview": "vitepress preview site",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "check:links": "node scripts/check-links.mjs",
    "check": "pnpm typecheck && pnpm test && pnpm build && pnpm check:links"
  },
  "dependencies": {
    "feed": "latest",
    "vitepress": "latest",
    "vue": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@types/node": "latest",
    "@vitejs/plugin-vue": "latest",
    "@vue/test-utils": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest",
    "vue-tsc": "latest"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run: `pnpm install`

Expected: 命令退出码为 0，生成 `pnpm-lock.yaml`，无依赖解析错误。

- [ ] **Step 3: 添加 TypeScript、Vitest 与最小 VitePress 配置**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "types": ["vite/client", "vitest/globals", "node"]
  },
  "include": ["site/**/*.ts", "site/**/*.vue", "scripts/**/*.ts", "tests/**/*.ts", "*.ts"]
}
```

```ts
// vitest.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: { environment: 'jsdom', include: ['site/**/*.test.ts'] }
})
```

```ts
// site/.vitepress/config.ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '王永忠',
  description: '前端开发者，正在向全栈工程师成长。',
  cleanUrls: true
})
```

```md
<!-- site/index.md -->
---
layout: home
title: 首页
description: 王永忠的项目、文章与全栈成长记录。
---
```

- [ ] **Step 4: 验证最小静态构建**

Run: `pnpm build`

Expected: 输出 `build complete`，并生成 `site/.vitepress/dist/index.html`。

- [ ] **Step 5: 提交基础工程**

```bash
git add package.json pnpm-lock.yaml tsconfig.json vitest.config.ts site
git commit -m "chore: initialize vitepress site"
```

### Task 2: 用测试驱动内容校验、排序和草稿过滤

**Files:**
- Create: `site/.vitepress/data/content.test.ts`
- Create: `site/.vitepress/data/content.ts`

- [ ] **Step 1: 编写失败的内容规则测试**

```ts
// site/.vitepress/data/content.test.ts
import { describe, expect, it } from 'vitest'
import { parsePost, parseProject, visibleByDate } from './content'

describe('content metadata', () => {
  it('rejects a post without a description', () => {
    expect(() => parsePost({ title: '文章', date: '2026-08-25', category: 'Vue', tags: [], draft: false })).toThrow(/description/)
  })

  it('requires a visible example marker for example projects', () => {
    expect(() => parseProject({ title: '案例', description: '摘要', date: '2026-08-25', tags: ['Vue'], featured: true, draft: false, example: true })).toThrow(/exampleLabel/)
  })

  it('filters drafts and sorts newest first', () => {
    const items = [
      { url: '/old', frontmatter: { date: '2026-01-01', draft: false } },
      { url: '/draft', frontmatter: { date: '2026-12-01', draft: true } },
      { url: '/new', frontmatter: { date: '2026-08-25', draft: false } }
    ]
    expect(visibleByDate(items).map(item => item.url)).toEqual(['/new', '/old'])
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm vitest run site/.vitepress/data/content.test.ts`

Expected: FAIL，错误包含 `Cannot find module './content'`。

- [ ] **Step 3: 实现内容类型和纯函数**

```ts
// site/.vitepress/data/content.ts
import { z } from 'zod'

const common = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().date(),
  tags: z.array(z.string()),
  draft: z.boolean().default(false),
  cover: z.string().optional()
})

export const postSchema = common.extend({ category: z.string().min(1) })
export const projectSchema = common.extend({
  featured: z.boolean().default(false),
  example: z.boolean().default(false),
  exampleLabel: z.string().min(1).optional()
}).superRefine((value, ctx) => {
  if (value.example && !value.exampleLabel) {
    ctx.addIssue({ code: 'custom', path: ['exampleLabel'], message: 'exampleLabel is required for example projects' })
  }
})

export type PostMeta = z.infer<typeof postSchema>
export type ProjectMeta = z.infer<typeof projectSchema>
export type ContentPage = { url: string; frontmatter: Record<string, unknown>; excerpt?: string }

export const parsePost = (value: unknown): PostMeta => postSchema.parse(value)
export const parseProject = (value: unknown): ProjectMeta => projectSchema.parse(value)

export function visibleByDate<T extends ContentPage>(items: T[]): T[] {
  return items
    .filter(item => item.frontmatter.draft !== true)
    .sort((a, b) => String(b.frontmatter.date).localeCompare(String(a.frontmatter.date)))
}
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm vitest run site/.vitepress/data/content.test.ts`

Expected: PASS，3 tests passed。

- [ ] **Step 5: 提交内容规则**

```bash
git add site/.vitepress/data
git commit -m "feat: validate markdown content metadata"
```

### Task 3: 添加个人资料与示例内容

**Files:**
- Create: `site/data/profile.ts`
- Create: `site/projects/index.md`
- Create: `site/projects/product-rebuild.md`
- Create: `site/projects/fullstack-lab.md`
- Create: `site/posts/index.md`
- Create: `site/posts/problem-before-technology.md`
- Create: `site/posts/fullstack-roadmap.md`
- Create: `site/posts/maintainable-vue-components.md`
- Create: `site/about.md`

- [ ] **Step 1: 添加不含虚假联系方式的个人资料**

```ts
// site/data/profile.ts
export const profile = {
  name: '王永忠',
  mark: '永',
  role: '前端开发者，正在向全栈工程师成长',
  intro: '关注可靠、清晰且好用的 Web 体验，也在持续探索服务端、数据与完整交付。',
  journey: ['前端基础与业务交付', '工程化与架构意识', 'Node.js、数据库与部署'],
  links: [] as Array<{ label: string; href: string }>
} as const
```

- [ ] **Step 2: 创建列表入口和关于页**

```md
<!-- site/projects/index.md -->
---
layout: projects
title: 项目
description: 项目案例与实践记录。
---
```

```md
<!-- site/posts/index.md -->
---
layout: posts
title: 文章
description: 前端、工程化与全栈学习记录。
---
```

```md
<!-- site/about.md -->
---
title: 关于我
description: 王永忠的个人介绍与全栈成长路径。
---

# 关于我

我是王永忠，一名前端开发者，正在向全栈工程师成长。

我关注用户体验与工程质量，也在学习 Node.js、数据库、部署与可观测性，希望逐步具备从界面到服务的完整交付能力。
```

- [ ] **Step 3: 创建两个明确标注的示例项目**

```md
<!-- site/projects/product-rebuild.md -->
---
title: 业务系统重构
description: 用于演示项目案例写法的结构样例，不代表真实工作经历。
date: 2026-08-25
tags: [Vue, TypeScript, 工程化]
featured: true
draft: false
example: true
exampleLabel: 示例项目
---

# 业务系统重构

> 示例项目：以下内容只展示案例结构，替换为真实项目后再移除此提示。

## 背景
展示如何清晰说明业务问题与改造目标。

## 角色与挑战
展示如何说明个人职责、约束与关键难点。

## 方案与结果
展示如何用可验证的信息描述方案、结果与反思。
```

```md
<!-- site/projects/fullstack-lab.md -->
---
title: 全栈学习实验室
description: 用于记录前端向服务端延伸的学习型项目结构样例。
date: 2026-08-20
tags: [Vue, Node.js, Database]
featured: true
draft: false
example: true
exampleLabel: 示例项目
---

# 全栈学习实验室

> 示例项目：这是内容结构样例，不代表已经完成的真实产品。

## 目标
把前端、API、数据存储和部署串成一条可验证的学习路径。

## 技术路线
以最小可运行功能为单位，记录选择、验证过程和复盘。
```

- [ ] **Step 4: 创建三篇有实际阅读价值且标注为示例内容的短文**

```md
<!-- site/posts/problem-before-technology.md -->
---
title: 从业务问题出发，而不是从技术方案出发
description: 在选择框架和模式前，先把目标、约束与验证方式说清楚。
date: 2026-08-25
category: 前端工程
tags: [工程思维, 产品]
draft: false
---

# 从业务问题出发，而不是从技术方案出发

> 示例文章：用于展示站点内容结构，后续将由真实文章替换。

## 先定义问题
技术方案只有放在明确目标中才有意义。先写清使用者、约束和成功标准，可以减少无效选择。

## 再缩小方案
比较方案时关注交付成本、维护成本和可验证性。能够解决当前问题的最小方案通常更适合首版。

## 最后复盘
上线后用实际反馈修正判断。复盘不仅记录结果，也记录当时为什么做出选择。
```

```md
<!-- site/posts/fullstack-roadmap.md -->
---
title: 从前端走向全栈：我的能力地图
description: 把服务端、数据与部署拆成可执行的学习路径。
date: 2026-08-22
category: 学习记录
tags: [Node.js, Database, 部署]
draft: false
---

# 从前端走向全栈：我的能力地图

> 示例文章：用于展示站点内容结构，后续将由真实文章替换。

## 从熟悉的边界出发
先理解浏览器与 API 的接口，再向鉴权、持久化和部署延伸。每一步都应有一个能运行的产物。

## 建立完整链路
把请求处理、数据库、日志和发布串起来，比孤立学习更多框架更有价值。

## 用项目验证
学习项目要能解释数据如何流动、错误如何暴露、版本如何发布。无法验证的知识很难形成稳定能力。
```

```md
<!-- site/posts/maintainable-vue-components.md -->
---
title: 构建可维护 Vue 组件时，我在关注什么
description: 用清晰边界、稳定接口和可验证状态降低组件维护成本。
date: 2026-08-18
category: Vue
tags: [Vue, TypeScript, 组件设计]
draft: false
---

# 构建可维护 Vue 组件时，我在关注什么

> 示例文章：用于展示站点内容结构，后续将由真实文章替换。

## 单一职责
组件应有一个清晰目的。展示、状态编排和数据访问混在一起时，理解与测试都会变难。

## 明确接口
Props、事件和插槽组成组件对外契约。TypeScript 类型应表达必填项、状态范围和默认行为。

## 可验证状态
优先测试访客能观察到的行为，而不是内部实现细节。稳定的行为测试允许组件在不破坏使用方的前提下重构。
```

- [ ] **Step 5: 构建以验证全部 Frontmatter**

Run: `pnpm build`

Expected: 构建通过，`dist/projects/` 与 `dist/posts/` 下存在详情 HTML。

- [ ] **Step 6: 提交内容骨架**

```bash
git add site/data site/projects site/posts site/about.md
git commit -m "content: add profile and example content"
```

### Task 4: 用组件测试驱动导航与主题交互

**Files:**
- Create: `site/.vitepress/theme/components/SiteHeader.test.ts`
- Create: `site/.vitepress/theme/components/ThemeToggle.vue`
- Create: `site/.vitepress/theme/components/SiteHeader.vue`

- [ ] **Step 1: 编写失败的组件测试**

```ts
// site/.vitepress/theme/components/SiteHeader.test.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SiteHeader from './SiteHeader.vue'

describe('SiteHeader', () => {
  it('renders the primary navigation and toggles the mobile menu', async () => {
    const wrapper = mount(SiteHeader)
    expect(wrapper.text()).toContain('项目')
    expect(wrapper.text()).toContain('文章')
    expect(wrapper.text()).toContain('关于')
    await wrapper.get('[aria-label="打开导航菜单"]').trigger('click')
    expect(wrapper.get('nav').attributes('data-open')).toBe('true')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm vitest run site/.vitepress/theme/components/SiteHeader.test.ts`

Expected: FAIL，错误包含 `Failed to resolve import "./SiteHeader.vue"`。

- [ ] **Step 3: 实现主题切换按钮**

```vue
<!-- site/.vitepress/theme/components/ThemeToggle.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'

const dark = ref(false)
onMounted(() => {
  const saved = localStorage.getItem('theme')
  dark.value = saved ? saved === 'dark' : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
  document.documentElement.classList.toggle('dark', dark.value)
})
function toggle() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  localStorage.setItem('theme', dark.value ? 'dark' : 'light')
}
</script>

<template><button class="icon-button" :aria-label="dark ? '切换到浅色模式' : '切换到深色模式'" @click="toggle">{{ dark ? '☀' : '◐' }}</button></template>
```

- [ ] **Step 4: 实现可访问的响应式导航**

```vue
<!-- site/.vitepress/theme/components/SiteHeader.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import ThemeToggle from './ThemeToggle.vue'
const open = ref(false)
const links = [
  { label: '项目', href: '/projects/' },
  { label: '文章', href: '/posts/' },
  { label: '关于', href: '/about' }
]
</script>

<template>
  <header class="site-header">
    <a class="brand" href="/" aria-label="王永忠首页">WYZ.</a>
    <button class="menu-button" aria-label="打开导航菜单" :aria-expanded="open" @click="open = !open">菜单</button>
    <nav :data-open="String(open)" aria-label="主导航">
      <a v-for="link in links" :key="link.href" :href="link.href" @click="open = false">{{ link.label }}</a>
      <ThemeToggle />
    </nav>
  </header>
</template>
```

- [ ] **Step 5: 运行组件测试并确认通过**

Run: `pnpm vitest run site/.vitepress/theme/components/SiteHeader.test.ts`

Expected: PASS，1 test passed。

- [ ] **Step 6: 提交交互组件**

```bash
git add site/.vitepress/theme/components
git commit -m "feat: add accessible site navigation"
```

### Task 5: 实现完全自定义主题与首页

**Files:**
- Create: `site/.vitepress/theme/index.ts`
- Create: `site/.vitepress/theme/Layout.vue`
- Create: `site/.vitepress/theme/styles.css`
- Create: `site/.vitepress/theme/components/HomePage.vue`
- Create: `site/.vitepress/theme/components/SiteFooter.vue`
- Create: `site/.vitepress/theme/components/NotFound.vue`
- Create: `site/public/brand.svg`
- Create: `site/public/og-default.svg`

- [ ] **Step 1: 注册自定义主题**

```ts
// site/.vitepress/theme/index.ts
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import './styles.css'

export default { Layout } satisfies Theme
```

- [ ] **Step 2: 实现布局分发**

```vue
<!-- site/.vitepress/theme/Layout.vue -->
<script setup lang="ts">
import { Content, useData } from 'vitepress'
import HomePage from './components/HomePage.vue'
import NotFound from './components/NotFound.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
const { frontmatter, isNotFound } = useData()
</script>

<template>
  <a class="skip-link" href="#main">跳到正文</a>
  <SiteHeader />
  <main id="main">
    <NotFound v-if="isNotFound" />
    <HomePage v-else-if="frontmatter.layout === 'home'" />
    <article v-else class="prose"><Content /></article>
  </main>
  <SiteFooter />
</template>
```

- [ ] **Step 3: 实现首页五段结构**

```vue
<!-- site/.vitepress/theme/components/HomePage.vue -->
<script setup lang="ts">
import { profile } from '../../../data/profile'
const projects = [
  { title: '业务系统重构', description: '展示项目案例写法的结构样例。', tags: ['Vue', 'TypeScript'] },
  { title: '全栈学习实验室', description: '记录前端向服务端延伸的学习路径。', tags: ['Node.js', 'Database'] }
]
const posts = ['从业务问题出发，而不是从技术方案出发', '从前端走向全栈：我的能力地图', '构建可维护 Vue 组件时，我在关注什么']
</script>

<template>
  <div class="home-page">
    <section class="hero section-shell">
      <div><p class="eyebrow">HELLO，我是{{ profile.name }}</p><h1>我为 Web 构建<br><em>好用的体验。</em></h1><p>{{ profile.intro }}</p><div class="actions"><a class="button primary" href="/projects/">查看项目</a><a class="button" href="/posts/">阅读文章</a></div></div>
      <img class="brand-mark" src="/brand.svg" alt="永字品牌图形" width="320" height="320">
    </section>
    <section class="section-shell"><div class="section-heading"><h2>精选项目</h2><a href="/projects/">查看全部 →</a></div><div class="card-grid projects"><a v-for="item in projects" :key="item.title" class="content-card" href="/projects/"><span class="example-label">示例项目</span><h3>{{ item.title }}</h3><p>{{ item.description }}</p><ul><li v-for="tag in item.tags" :key="tag">{{ tag }}</li></ul></a></div></section>
    <section class="section-shell"><div class="section-heading"><h2>最新文章</h2><a href="/posts/">浏览文章 →</a></div><div class="card-grid posts"><a v-for="title in posts" :key="title" class="content-card" href="/posts/"><small>示例文章</small><h3>{{ title }}</h3></a></div></section>
    <section class="section-shell journey"><div><p class="eyebrow">成长路径</p><h2>不只展示结果，<br>也记录成长过程。</h2></div><ol><li v-for="step in profile.journey" :key="step">{{ step }}</li></ol></section>
    <section v-if="profile.links.length" class="section-shell contact"><h2>一起聊聊。</h2><a v-for="link in profile.links" :key="link.href" :href="link.href" target="_blank" rel="noreferrer">{{ link.label }} ↗</a></section>
  </div>
</template>
```

- [ ] **Step 4: 实现页脚和 404**

```vue
<!-- site/.vitepress/theme/components/SiteFooter.vue -->
<script setup lang="ts">import { profile } from '../../../data/profile'</script>
<template><footer><strong>王永忠</strong><span>{{ profile.role }}</span><small>© {{ new Date().getFullYear() }}</small></footer></template>
```

```vue
<!-- site/.vitepress/theme/components/NotFound.vue -->
<template><section class="not-found"><p>404</p><h1>这个页面不存在</h1><a href="/">返回首页</a></section></template>
```

- [ ] **Step 5: 建立设计系统样式**

```css
/* site/.vitepress/theme/styles.css */
:root { color-scheme: light; --bg:#fff; --surface:#f3f4f8; --text:#171922; --muted:#666979; --accent:#5b5ce2; --border:#e5e6ec; --radius:18px; --width:1120px; font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
.dark { color-scheme:dark; --bg:#111217; --surface:#1b1d25; --text:#f5f6fa; --muted:#a7a9b5; --accent:#9192ff; --border:#2b2e38; }
* { box-sizing:border-box; }
html { background:var(--bg); color:var(--text); scroll-behavior:smooth; }
body { margin:0; background:var(--bg); }
a { color:inherit; text-decoration:none; }
a:focus-visible,button:focus-visible { outline:3px solid var(--accent); outline-offset:3px; }
.skip-link { position:fixed; left:16px; top:-80px; z-index:100; padding:10px 14px; background:var(--text); color:var(--bg); }
.skip-link:focus { top:16px; }
.site-header { position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between; max-width:var(--width); margin:auto; padding:18px 24px; background:color-mix(in srgb,var(--bg) 88%,transparent); backdrop-filter:blur(16px); }
.brand { font-weight:900; letter-spacing:-.04em; }
.site-header nav { display:flex; align-items:center; gap:24px; }
.menu-button { display:none; }
.icon-button,.menu-button { border:1px solid var(--border); background:var(--surface); color:var(--text); border-radius:999px; padding:8px 11px; }
.section-shell,.prose { max-width:var(--width); margin:auto; padding:72px 24px; }
.hero { display:grid; grid-template-columns:1.5fr .7fr; align-items:center; gap:60px; min-height:620px; }
.eyebrow { color:var(--accent); font-size:.78rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
.hero h1 { margin:16px 0; font-size:clamp(3rem,7vw,6.6rem); line-height:.98; letter-spacing:-.065em; }
.hero h1 em { color:var(--accent); font-style:normal; }
.hero p { max-width:620px; color:var(--muted); line-height:1.8; }
.brand-mark { width:100%; height:auto; border-radius:28px; }
.actions { display:flex; gap:10px; margin-top:28px; }
.button { padding:12px 18px; border-radius:999px; background:var(--surface); }
.button.primary { background:var(--text); color:var(--bg); }
.section-heading { display:flex; align-items:end; justify-content:space-between; margin-bottom:24px; }
.section-heading h2,.journey h2 { margin:0; font-size:clamp(2rem,4vw,3.7rem); letter-spacing:-.04em; }
.section-heading a { color:var(--accent); }
.card-grid { display:grid; gap:16px; }
.card-grid.projects { grid-template-columns:1.35fr 1fr; }
.card-grid.posts { grid-template-columns:repeat(3,1fr); }
.content-card { min-height:220px; padding:26px; border:1px solid var(--border); border-radius:var(--radius); background:var(--surface); transition:transform .2s ease,border-color .2s ease; }
.content-card:hover { transform:translateY(-4px); border-color:var(--accent); }
.content-card h3 { margin:38px 0 10px; font-size:1.35rem; }
.content-card p,small { color:var(--muted); }
.content-card ul { display:flex; gap:8px; padding:0; list-style:none; }
.content-card li,.example-label { padding:4px 8px; border:1px solid var(--border); border-radius:999px; font-size:.72rem; }
.journey { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
.journey ol { border-left:2px solid var(--accent); color:var(--muted); line-height:3; }
.prose { max-width:760px; line-height:1.85; }
.prose img { max-width:100%; height:auto; }
footer { display:flex; gap:16px; justify-content:space-between; max-width:var(--width); margin:auto; padding:36px 24px; border-top:1px solid var(--border); color:var(--muted); }
.not-found { min-height:60vh; display:grid; place-content:center; text-align:center; }
@media (max-width:768px) { .menu-button{display:block}.site-header nav{display:none;position:absolute;left:16px;right:16px;top:64px;padding:18px;flex-direction:column;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius)}.site-header nav[data-open="true"]{display:flex}.hero,.journey{grid-template-columns:1fr;min-height:auto}.brand-mark{max-width:220px}.card-grid.projects,.card-grid.posts{grid-template-columns:1fr}.section-shell{padding:52px 20px}footer{flex-direction:column}.section-heading{align-items:start;gap:12px;flex-direction:column} }
@media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition:none!important; animation:none!important; } }
```

- [ ] **Step 6: 添加品牌与分享 SVG**

`brand.svg` 使用 1:1 viewBox、紫蓝渐变背景和居中的白色“永”字；`og-default.svg` 使用 1200×630 viewBox，包含姓名、角色描述和相同品牌图形，不引用外部字体或图片。

- [ ] **Step 7: 构建并人工检查首页**

Run: `pnpm build && pnpm dev`

Expected: 构建通过；首页依次显示五个确认区块；375px 下单列且无横向滚动；深浅主题均可读。

- [ ] **Step 8: 提交主题**

```bash
git add site/.vitepress/theme site/public
git commit -m "feat: build custom portfolio theme"
```

### Task 6: 接入 Markdown 列表数据与内容卡片

**Files:**
- Create: `site/projects/projects.data.ts`
- Create: `site/posts/posts.data.ts`
- Create: `site/.vitepress/theme/components/ContentCard.vue`
- Create: `site/.vitepress/theme/components/ContentList.vue`
- Modify: `site/.vitepress/theme/Layout.vue`
- Modify: `site/.vitepress/theme/components/HomePage.vue`

- [ ] **Step 1: 创建项目与文章 loader**

```ts
// site/projects/projects.data.ts
import { createContentLoader } from 'vitepress'
import { parseProject, visibleByDate } from '../.vitepress/data/content'
export default createContentLoader('projects/*.md', {
  excerpt: true,
  transform: pages => visibleByDate(pages.filter(page => !page.url.endsWith('/projects/'))).map(page => ({ ...page, frontmatter: parseProject(page.frontmatter) }))
})
```

```ts
// site/posts/posts.data.ts
import { createContentLoader } from 'vitepress'
import { parsePost, visibleByDate } from '../.vitepress/data/content'
export default createContentLoader('posts/*.md', {
  excerpt: true,
  transform: pages => visibleByDate(pages.filter(page => !page.url.endsWith('/posts/'))).map(page => ({ ...page, frontmatter: parsePost(page.frontmatter) }))
})
```

- [ ] **Step 2: 实现通用卡片和列表**

```vue
<!-- site/.vitepress/theme/components/ContentCard.vue -->
<script setup lang="ts">
defineProps<{ url:string; title:string; description:string; date:string; tags:string[]; exampleLabel?:string }>()
</script>
<template><a class="content-card" :href="url"><span v-if="exampleLabel" class="example-label">{{ exampleLabel }}</span><time :datetime="date">{{ date }}</time><h3>{{ title }}</h3><p>{{ description }}</p><ul aria-label="标签"><li v-for="tag in tags" :key="tag">{{ tag }}</li></ul></a></template>
```

```vue
<!-- site/.vitepress/theme/components/ContentList.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { data as posts } from '../../../posts/posts.data'
import { data as projects } from '../../../projects/projects.data'
import ContentCard from './ContentCard.vue'
const props = defineProps<{ kind:'projects'|'posts' }>()
const items = computed(() => props.kind === 'projects' ? projects : posts)
const heading = computed(() => props.kind === 'projects' ? '项目' : '文章')
const intro = computed(() => props.kind === 'projects' ? '项目案例与实践记录。' : '前端、工程化与全栈学习记录。')
</script>
<template><section class="section-shell"><p class="eyebrow">WORK & NOTES</p><h1>{{ heading }}</h1><p>{{ intro }}</p><div v-if="items.length" class="card-grid"><ContentCard v-for="item in items" :key="item.url" :url="item.url" :title="item.frontmatter.title" :description="item.frontmatter.description" :date="item.frontmatter.date" :tags="item.frontmatter.tags" :example-label="'exampleLabel' in item.frontmatter ? item.frontmatter.exampleLabel : undefined" /></div><p v-else>内容正在准备中。</p></section></template>
```

- [ ] **Step 3: 将列表布局接入 Layout**

在 `Layout.vue` 导入 `ContentList`，将 `<HomePage ... />` 后的分支改为：

```vue
<ContentList v-else-if="frontmatter.layout === 'projects'" kind="projects" />
<ContentList v-else-if="frontmatter.layout === 'posts'" kind="posts" />
<article v-else class="prose"><Content /></article>
```

- [ ] **Step 4: 首页改用 loader 数据**

删除 `HomePage.vue` 中的静态 `projects` 与 `posts`，导入 loader 和 `ContentCard`：

```ts
import { computed } from 'vue'
import { data as allPosts } from '../../../posts/posts.data'
import { data as allProjects } from '../../../projects/projects.data'
import ContentCard from './ContentCard.vue'
const projects = computed(() => allProjects.filter(item => item.frontmatter.featured).slice(0, 2))
const posts = computed(() => allPosts.slice(0, 3))
```

两个卡片网格都改为向 `ContentCard` 传递 `item.url` 与 `item.frontmatter` 的字段；项目额外传递 `exampleLabel`。组件内部不得保留重复 Frontmatter。

- [ ] **Step 5: 验证列表与详情路由**

Run: `pnpm build`

Expected: `/projects/` 显示 2 项、`/posts/` 显示 3 项；首页显示相同数据；所有详情链接均生成 HTML。

- [ ] **Step 6: 提交数据接入**

```bash
git add site/projects site/posts site/.vitepress/theme
git commit -m "feat: render markdown projects and posts"
```

### Task 7: 完成 SEO、RSS、Sitemap 与链接检查

**Files:**
- Create: `scripts/generate-feed.ts`
- Create: `scripts/check-links.mjs`
- Modify: `site/.vitepress/config.ts`
- Modify: `package.json`

- [ ] **Step 1: 为 feed 生成器编写失败测试**

在 `site/.vitepress/data/content.test.ts` 中从 `../../../../scripts/generate-feed` 导入 `buildFeedItems`，增加断言：草稿文章不进入 feed，合法文章输出标题、绝对 URL 和 RFC 822 日期。

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm vitest run site/.vitepress/data/content.test.ts`

Expected: FAIL，错误包含 `buildFeedItems is not exported`。

- [ ] **Step 3: 实现 RSS 数据转换和构建钩子**

`scripts/generate-feed.ts` 导出 `buildFeedItems`，复用 `visibleByDate`，用 `new URL(post.url, siteUrl)` 生成绝对链接；`generateFeed(siteUrl, outDir, posts)` 使用 `feed` 包写入 `rss.xml`。在 VitePress `buildEnd` 钩子中调用生成器，生产构建若未设置 `VITE_SITE_URL` 则明确报错，开发环境默认 `http://localhost:5173`。

- [ ] **Step 4: 配置 Sitemap、页面元数据和规范链接**

在 `config.ts` 中添加 `sitemap.hostname = siteUrl`、默认 Open Graph 标签和 `transformHead`。`transformHead` 使用当前 `pageData.relativePath` 生成唯一 canonical URL，并优先使用页面 Frontmatter 的 `title`、`description` 和 `cover`；无封面时使用 `/og-default.svg`。

- [ ] **Step 5: 添加 robots 与构建后链接检查器**

在 `buildEnd(siteConfig)` 中用 Node `writeFile` 直接写入 `${siteConfig.outDir}/robots.txt`，内容由当前 `siteUrl` 拼出：

```ts
await writeFile(join(siteConfig.outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', siteUrl)}\n`, 'utf8')
```

`scripts/check-links.mjs` 递归读取 `site/.vitepress/dist/**/*.html`，收集以 `/` 开头的 `href`，将 clean URL 映射到对应的 `index.html` 或 `.html` 文件；任一目标不存在时列出来源与链接并退出 1，否则输出检查数量并退出 0。

- [ ] **Step 6: 验证 SEO 产物**

Run: `$env:VITE_SITE_URL='https://example.invalid'; pnpm test; pnpm build; pnpm check:links`

Expected: 单元测试通过；构建产物包含 `rss.xml`、`sitemap.xml`、替换后的 `robots.txt`；链接检查退出码为 0。`example.invalid` 仅用于本地验证，不部署该构建产物。

- [ ] **Step 7: 提交 SEO 与发布检查**

```bash
git add package.json scripts site/.vitepress
git commit -m "feat: add seo feeds and link validation"
```

### Task 8: 增加端到端测试和发布质量门禁

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/site.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: 添加 Playwright 配置**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: { command: 'pnpm dev', port: 5173, reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } }
  ]
})
```

- [ ] **Step 2: 编写关键路径测试**

```ts
// tests/e2e/site.spec.ts
import { expect, test } from '@playwright/test'

test('visitor can navigate the primary pages', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('好用的体验')
  await page.getByRole('link', { name: '项目' }).click()
  await expect(page).toHaveURL(/\/projects\/$/)
  await expect(page.getByText('示例项目').first()).toBeVisible()
  await page.getByRole('link', { name: '文章' }).click()
  await expect(page).toHaveURL(/\/posts\/$/)
})

test('theme toggle and not-found page are accessible', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '切换到深色模式' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.goto('/missing-page')
  await expect(page.getByRole('heading', { name: '这个页面不存在' })).toBeVisible()
  await expect(page.getByRole('link', { name: '返回首页' })).toBeVisible()
})
```

- [ ] **Step 3: 安装浏览器并运行端到端测试**

Run: `pnpm exec playwright install chromium; pnpm test:e2e`

Expected: desktop 和 mobile 两个项目共 4 项测试全部通过。

- [ ] **Step 4: 运行完整质量门禁**

Run: `$env:VITE_SITE_URL='https://example.invalid'; pnpm check`

Expected: 类型检查、单元测试、静态构建和链接检查全部退出 0。

- [ ] **Step 5: 提交端到端测试**

```bash
git add playwright.config.ts tests package.json pnpm-lock.yaml
git commit -m "test: cover critical visitor journeys"
```

### Task 9: 部署到腾讯云上海 COS 并验证公网访问

**Files:**
- Create: `docs/deployment.md`
- Modify: `site/.vitepress/config.ts`（只在实际 COS 地址要求调整 base 时修改；默认根路径不修改）

- [ ] **Step 1: 编写部署手册**

`docs/deployment.md` 必须记录：上海地域 `ap-shanghai`、私有身份信息不进入仓库、静态网站首页为 `index.html`、错误文档为 `404.html`、上传源目录为 `site/.vitepress/dist`、缓存策略（带 hash 资源一年，HTML 不缓存或短缓存）、临时站点 URL、清理与回滚方法，以及备案完成后的 DNSPod/SSL/EdgeOne 操作顺序。

- [ ] **Step 2: 在腾讯云控制台创建上海 COS 存储桶**

在浏览器执行前请求一次即时确认，因为该步骤会创建云资源。选择上海地域、静态网站所需的公开读取策略和一个全局唯一且不含敏感信息的存储桶名；不创建永久 API 密钥。

Expected: 控制台显示存储桶创建成功，地域为上海。

- [ ] **Step 3: 开启静态网站托管**

将索引文档设为 `index.html`，错误文档设为 `404.html`。把控制台生成且匹配 `https://[^/]+\.cos-website\.ap-shanghai\.myqcloud\.com` 的完整地址记录为当前 PowerShell 会话变量 `$env:COS_SITE_URL`，并写入部署文档的“当前临时网址”字段。

- [ ] **Step 4: 使用真实临时地址构建生产产物**

Run: `if (-not $env:COS_SITE_URL) { throw 'COS_SITE_URL 未设置' }; $env:VITE_SITE_URL=$env:COS_SITE_URL; pnpm check`

Expected: 全部门禁通过；`robots.txt`、`rss.xml`、`sitemap.xml` 和 canonical URL 均包含实际 COS 主机名。

- [ ] **Step 5: 上传构建产物**

在浏览器执行上传前请求一次即时确认，因为文件将传输至腾讯云。上传 `site/.vitepress/dist` 内的文件并保持目录结构；不得上传源码、`.git`、环境变量或本地测试报告。

Expected: COS 文件列表包含根 `index.html`、`404.html`、`assets/`、`projects/`、`posts/`、`rss.xml`、`sitemap.xml` 和 `robots.txt`。

- [ ] **Step 6: 从公网验证临时站点**

打开 COS 静态网站地址，检查首页、项目、文章、关于、详情刷新、404、深浅主题和移动端布局；运行 Lighthouse，四项分数均应达到 90 或以上。若 HTTPS 临时域名能力受 COS 控制台实际限制，则记录控制台提供的协议和原因，不绕过浏览器安全警告。

- [ ] **Step 7: 提交部署文档与最终状态**

```bash
git add docs/deployment.md
git commit -m "docs: document cos deployment and domain cutover"
git status --short
```

Expected: 工作树干净；部署文档包含实际临时网址，不包含密钥、账号 ID 之外的敏感个人信息或未替换占位符。

---

## 最终验收清单

- [ ] 首页五段信息结构与批准的现代产品视觉一致。
- [ ] 项目、文章和个人资料均可通过集中内容文件替换。
- [ ] 示例内容没有被表述为真实履历或成果。
- [ ] 主要页面在桌面和移动端可访问、可键盘操作。
- [ ] 类型检查、单元测试、端到端测试、构建和链接检查全部通过。
- [ ] RSS、Sitemap、robots、canonical 与 Open Graph 使用实际临时站点 URL。
- [ ] 上海 COS 临时网址可从公网访问。
- [ ] `zycesay.cn` 在备案完成前未绑定中国大陆托管资源。
- [ ] 备案后切换到裸域名、HTTPS 与 EdgeOne 的步骤已记录。
