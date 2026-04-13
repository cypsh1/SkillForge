# Task Log: SEO-INFRA — Phase 1 SEO 基建

**日期**：2026-04-13
**状态**：✅ 完成

## 目标

为 SkillForge 官网和 GitHub 仓库补全 SEO 基建，解决分享链接无预览卡片、搜索引擎无法有效索引的问题。

## 完成内容

### 网站 SEO（5 项）
1. 安装 @astrojs/sitemap，配置 i18n locale 映射（zh→zh-CN, en→en-US）
2. 创建 robots.txt（Allow all + Sitemap + Host 指令）
3. 生成 OG 社交预览图 1280x640（Node.js + sharp 脚本，从 hero-overview.png 合成）
4. BaseLayout.astro 补全：canonical / 3 条 hreflang / 7 条 OG / 4 条 Twitter Card / theme-color / JSON-LD SoftwareApplication
5. zh/en 两个页面文件新增 locale prop 传递

### GitHub 仓库 SEO（4 项）
6. package.json 补全 description/keywords/homepage/repository/author/license
7. .github/release.yml 自动分类 Release Notes
8. README 新增 3 个 shields.io 徽章（Build/Website/Downloads）
9. CHANGELOG.md（V1.0.0 + V1.1.0 变更记录）

### GitHub 设置（4 项，通过 gh CLI 自动化）
10. 仓库描述、Homepage URL、10 个 Topics、Social Preview 图片

## 验证

### 本地构建
- `cd website && npm run build` ✅
- `npx tsc -b --noEmit` ✅
- `npm run build`（根目录）✅
- dist 产物检查：sitemap-index.xml / sitemap-0.xml / robots.txt / og-image.png / zh+en HTML SEO 标签 ✅

### 线上验证
- robots.txt 200 ✅
- sitemap-index.xml 200 + hreflang 交叉链接 ✅
- og-image.png 200 (51KB) ✅
- OG/Twitter/canonical/hreflang 标签完整 ✅
- JSON-LD SoftwareApplication 结构化数据完整 ✅
- GitHub repo 描述 + Topics + Homepage ✅

## 涉及文件

- `website/astro.config.mjs` — +sitemap 集成
- `website/src/layouts/BaseLayout.astro` — 主要改动（+70 行 SEO 标签）
- `website/src/pages/zh/index.astro` — +locale prop
- `website/src/pages/en/index.astro` — +locale prop
- `website/public/robots.txt` — 新建
- `website/public/og-image.png` — 新建（1280x640）
- `website/generate-og-image.mjs` — 新建（OG 图片生成脚本）
- `website/capture-screenshots.mjs` — 新建（产品截图脚本）
- `package.json` — +元数据字段
- `.github/release.yml` — 新建
- `README.md` — +3 徽章
- `CHANGELOG.md` — 新建

## 跳过调研说明

本次为已有技术栈内的标准 SEO 实现（Astro sitemap 插件 + HTML meta 标签），属于重复模式，但仍做了 3 轮调研：Astro 5.x SEO 最佳实践、GitHub SEO 优化策略、开源工具推广方案。
