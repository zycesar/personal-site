# GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the existing VitePress personal site at `https://zycesar.github.io/personal-site/` after every push to `main`.

**Architecture:** Treat `VITE_SITE_URL` as the full public site root, including the GitHub Pages repository path, and derive VitePress's `base` from it. Route every UI link and generated metadata URL through the deployment base, teach the static link checker about that base, and deploy the verified `site/.vitepress/dist` artifact with GitHub's official Pages actions.

**Tech Stack:** Vue 3, VitePress, TypeScript, Vitest, pnpm, GitHub Actions, GitHub Pages

---

### Task 1: Make public URLs subpath-aware

**Files:**
- Modify: `site/.vitepress/data/content.test.ts`
- Modify: `scripts/generate-feed.ts`
- Modify: `scripts/discover-drafts.ts`
- Modify: `site/.vitepress/config.ts`

- [ ] **Step 1: Write failing tests** asserting that a clean `https://example.com/personal-site/` URL is accepted, RSS links preserve `/personal-site/`, and sitemap draft matching works with the same base path.
- [ ] **Step 2: Run `pnpm test site/.vitepress/data/content.test.ts`** and confirm failures are caused by the current root-only URL handling.
- [ ] **Step 3: Implement minimal URL normalization and base-aware URL joining**, then set VitePress `base` from the normalized site URL pathname.
- [ ] **Step 4: Re-run the focused tests** and confirm they pass.

### Task 2: Prefix runtime navigation and static link checks

**Files:**
- Modify: `site/.vitepress/theme/components/SiteHeader.vue`
- Modify: `site/.vitepress/theme/components/HomePage.vue`
- Modify: `site/.vitepress/theme/components/ContentCard.vue`
- Modify: `site/.vitepress/theme/components/NotFound.vue`
- Modify: `site/.vitepress/theme/components/SiteHeader.test.ts`
- Modify: `site/.vitepress/theme/components/HomePage.test.ts`
- Modify: `site/.vitepress/theme/Layout.test.ts`
- Modify: `scripts/check-links.test.ts`
- Modify: `scripts/check-links.mjs`

- [ ] **Step 1: Write failing component and link-checker tests** expecting `/personal-site/`-prefixed navigation, assets, content cards, and 404 recovery links.
- [ ] **Step 2: Run the focused Vitest files** and verify the expected base-path failures.
- [ ] **Step 3: Use VitePress `withBase` for every internal runtime URL** and strip the configured deployment base before mapping generated links to files in `dist`.
- [ ] **Step 4: Re-run the focused tests** and confirm they pass.

### Task 3: Add automated Pages deployment

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `docs/deployment.md`

- [ ] **Step 1: Add a GitHub Actions workflow** that installs pnpm and Node, runs the full check with `VITE_SITE_URL=https://zycesar.github.io/personal-site/` and `VITE_BASE_PATH=/personal-site/`, uploads `site/.vitepress/dist`, and deploys it with the official Pages action.
- [ ] **Step 2: Document the public URL and push-to-deploy workflow** without mentioning the deferred custom domain as a current requirement.
- [ ] **Step 3: Run `pnpm check` with the production URL/base environment**, inspect generated canonical/RSS/sitemap/asset URLs, and run E2E locally.
- [ ] **Step 4: Commit the verified changes, push `HEAD` to the new repository's `main`, and verify the Pages workflow and public URL.**

