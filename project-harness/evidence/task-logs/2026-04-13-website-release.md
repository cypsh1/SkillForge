# Task Log — 官网开发 + 发布体系搭建

**日期**：2026-04-13
**任务 ID**：V1.1-WEBSITE + V1.1-CI
**耗时**：1 个会话

## 完成内容

### 1. 产品官网（website/）

**技术栈**：Astro 5.18 + Tailwind 4 + Geist 字体，暗色主题

**内容架构**（基于行业调研 FAB 框架）：

| 区块 | 内容 |
|------|------|
| Hero | 标语 + Benefit 副标题 + 指标条（4来源/5规则/3端/双语）+ 双CTA |
| 三支柱概览 | 可视化编辑 / 连接一切 / 质量守护 — 3 张可点击卡片 |
| 三支柱 FAB 展开 | 每组：Benefit 标题 + 痛点描述 + 4 Feature 小点 + 截图 |
| 下载区 | 三平台卡片 → GitHub Releases |
| 路线图 | V1.0/V1.1 已完成，V1.2 规划中，V2.0 远期 |
| 终极 CTA | 渐变背景 + 单按钮 |
| Footer | Logo + GitHub/反馈链接 |

**多语言**：中英双语，文件路由 `/zh/` + `/en/`，Navbar 语言切换

**部署**：GitHub Pages + Actions 自动部署（push website/** 触发）

**产品截图**：4 张（Hero 全貌 + 3 个支柱场景），Playwright 自动截取

**滚动动画**：IntersectionObserver + `.reveal` CSS class，fade-in 效果

### 2. README.md 重写

- V1.1 全部功能覆盖
- 中英双语（中文主体 + English 锚点）
- shields.io badge（license + version）
- 项目结构更新（含 website/ 和 src-tauri/ssh.rs）

### 3. GitHub Actions — 三端构建发布

**文件**：`.github/workflows/build-release.yml`

**触发**：push `v*` tag

**构建矩阵**：
- macOS Apple Silicon（aarch64）
- macOS Intel（x86_64）
- Linux x64
- Windows x64

**发布**：tauri-apps/tauri-action 自动上传到 GitHub Release（Draft）

### 4. V1.1.0 发布

- Tag `v1.1.0` 已推送
- 四平台构建已触发

## 调研

本次官网开发前进行了行业调研（跳过调研不合规）：

- **竞品分析**：Cursor / Linear / Warp / Raycast / Zed 5 个开发者工具官网
- **方法论**：Evil Martians 100+ 开发者工具落地页研究、FAB 框架转化率数据
- **关键决策**：3 支柱分组（3/5 竞品使用）、Hero 指标条（3/5 竞品使用）、双 CTA

## 新增文件

| 文件 | 职责 |
|------|------|
| `website/` 整个目录 | Astro 官网项目 |
| `.github/workflows/deploy-website.yml` | 官网自动部署 |
| `.github/workflows/build-release.yml` | 三端构建发布 |

## 修改文件

| 文件 | 变更 |
|------|------|
| `README.md` | V1.1 全面重写 |
| `.gitignore` | 追加 `website/.astro/` |

## 验证

- `npx astro build` ✅
- GitHub Pages 部署 ✅（cypsh1.github.io/SkillForge）
- 中英双语切换 ✅
- 语言切换链接路径修复 ✅（BASE_URL 尾部斜杠问题）
- 三端构建 Actions 已触发（等待结果）
