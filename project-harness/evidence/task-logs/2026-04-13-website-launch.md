# 官网开发 + V1.1.0 发布体系

**日期**: 2026-04-13
**状态**: ✅ 完成

## 目标

为 SkillForge 搭建产品官网并建立三端自动构建发布体系。

## 完成内容

### 产品官网（Astro 5 + Tailwind 4）

| 项 | 说明 |
|---|---|
| 技术栈 | Astro 5、Tailwind 4、Geist 字体、暗色主题 |
| 内容架构 | FAB 三支柱（可视化编辑 / 连接一切 / 质量守护），基于行业调研 |
| 多语言 | 中英双语，文件路由（/zh/ + /en/） |
| 部署 | GitHub Pages + Actions 自动部署 |
| 地址 | https://cypsh1.github.io/SkillForge/ |

### 页面结构

1. Hero — 标语 + 指标条（4来源/5规则/3端/双语）+ 双 CTA + 产品截图
2. 三支柱概览 — 3 张卡片
3. 三支柱 FAB 展开 — Benefit 标题 + 痛点描述 + Feature 列表 + 截图
4. 下载区 — 三平台直链 + 平台自动检测高亮 + 架构标注
5. 路线图 — V1.0/V1.1 已完成、V1.2 规划中、V2.0 远期
6. 终极 CTA + Footer

### 行业调研

- 分析 5 个竞品官网（Cursor / Linear / Zed / Raycast / Warp）
- 参考 Evil Martians 100+ 开发者工具落地页研究
- FAB 框架比纯 Feature 列表转化率高 42%（Content Marketing Institute）
- 三支柱分组是最常见模式（3/5 竞品使用）

### 发布体系

| 项 | 说明 |
|---|---|
| CI Workflow | `.github/workflows/build-release.yml` — push `v*` tag 触发 |
| 构建平台 | macOS ARM + Intel、Windows、Linux |
| Release | v1.1.0 已发布，9 个安装包（.dmg/.exe/.msi/.deb/.rpm/.AppImage） |

### README.md

- V1.1 全功能覆盖，中英双语
- shields badge（license / version / build / website / downloads）

## 涉及文件

- `website/` — 全部新建（Astro 项目）
- `.github/workflows/deploy-website.yml` — 官网自动部署
- `.github/workflows/build-release.yml` — 三端构建发布
- `README.md` — 重写

## 验证

- tsc ✅ build ✅（主项目 + 官网）
- 官网 dev + build 正常
- GitHub Pages 部署成功
- GitHub Release v1.1.0 发布成功，9 个安装包可下载
- 下载链接指向具体文件，平台自动检测生效
