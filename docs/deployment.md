# 部署说明

## 当前部署地址

站点通过 GitHub Pages 发布：

- <https://zycesar.github.io/personal-site/>

暂不绑定独立域名。

## 自动部署

`.github/workflows/deploy-pages.yml` 会在 `main` 分支收到推送时执行：

1. 使用 pnpm 安装锁定版本的依赖。
2. 运行类型检查、Vitest、VitePress 生产构建和内部链接检查。
3. 上传 `site/.vitepress/dist`。
4. 发布到 GitHub Pages。

更新文章、项目或页面后，将提交推送到 `main` 即可触发新部署。部署状态可以在仓库的 **Actions** 页面查看。

## 本地验证生产构建

PowerShell：

```powershell
$env:VITE_SITE_URL = 'https://zycesar.github.io/personal-site/'
$env:VITE_BASE_PATH = '/personal-site/'
pnpm check
```

生产 URL 必须保留结尾的 `/personal-site/`，否则生成的导航、静态资源、Canonical、RSS 和 Sitemap 地址会与 GitHub Pages 的仓库路径不一致。
