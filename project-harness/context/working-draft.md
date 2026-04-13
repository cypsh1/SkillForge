# Working Draft — 推广自动化方案（Phase 2-3）

> **存档时间**：2026-04-13
> **状态**：方案已定，待实施
> **新会话第一件事**：确认采用 B-Lite 方案，开始搭建 launch-playbook 仓库

---

## 一、已完成

### Phase 1：SEO 基建 ✅

10 项代码改动 + 4 项 GitHub 设置，已推送并线上验证通过。

- 网站：sitemap（i18n hreflang）/ robots.txt / OG 预览图 / canonical + hreflang / OG + Twitter 标签 / JSON-LD / theme-color
- GitHub：package.json 元数据 / release.yml / README 徽章 / CHANGELOG
- GitHub 设置：仓库描述 + Homepage + 10 Topics + Social Preview（gh CLI 自动化）

### Phase 2：自动化发布链路 ✅（基础版）

- `release-announce.yml` 已创建并验证通过
- 触发条件：`release: published` + `workflow_dispatch`
- 当前只有 social-changelog 文案生成，通知渠道预留注释
- **已知问题**：缺少 `setup-node@v4` 指定 Node 22（social-changelog 要求 ≥22，当前 runner 默认 Node 20，暂时 warning 没报错但随时可能 break）

---

## 二、待实施：Phase 2 升级 + Phase 3 首发

### 核心决策：采用 B-Lite 方案

经过工具排雷，放弃 Postiz 自托管（太重），采用"各平台直接 API/Action"的轻量方案。

#### 方案演进过程

```
方案 A（纯 Actions）→ 方案 B（+Postiz）→ 排雷 → 方案 B-Lite（直接 API）
                                              ↓
                                         Postiz 4GB RAM + Temporal
                                         502 是 #1 问题
                                         X 图片静默失败
                                         API 未文档化必填字段
                                         → 对"发版发几条帖子"过重
```

#### B-Lite 方案架构

```
GitHub Release (published)
  → Step 1: setup-node@v4 (Node 22)
  → Step 2: social-changelog 生成基础文案 (GitHub Models, 免费)
  → Step 3: Claude API 按渠道模板改写 (可选，替代已死的 recast-mcp)
  → Step 4: 各平台直接发布
       ├── Discord: curl webhook
       ├── Dev.to: curl POST /api/articles (创建草稿)
       ├── Bluesky: zentered/bluesky-post-action
       └── Reddit: bluwy/release-for-reddit-action@v2
```

**月成本：$0 | 维护：零 | 基础设施：无（全跑在 GitHub Actions）**

#### 后续升级路径

当需要定时排期、UI 管理多账号、内容日历时 → 部署 Postiz，升级到方案 C。

---

### 工具排雷结果汇总

| 工具 | 结论 | 关键发现 |
|------|------|----------|
| **social-changelog** | ✅ 采用但需修复 | 要 Node ≥22；无 published release 时 exit 1；47 stars 低采纳 |
| **Postiz** | ⏸ 暂缓 | 需 4GB RAM（PG+Redis+Temporal+ES）；502 是 #1 问题；X 图片 bug；API 有未文档化必填字段 |
| **recast-mcp** | ❌ 移除 | 2026-03-31 已 archived，0 stars，3 commits，死项目 |
| **Dev.to API** | ✅ 采用 | 稳定，curl 直调，支持草稿，10 次/30 秒限制够用 |
| **Bluesky Action** | ✅ 采用 | zentered/bluesky-post-action，免费开放 API |
| **Reddit Action** | ✅ 采用 | bluwy/release-for-reddit-action@v2，17 stars，0 open issues |
| **sinedied/publish-devto** | ⏸ 不用 | 43 stars，但对单篇文章过重（期望 posts/ 目录结构），直接 curl 更简单 |
| **n8n** | ⏸ 暂缓 | Postiz API + GitHub Actions 够用时不需要额外编排层 |
| **MCP Registry** | ❌ 无可用 | 搜索 6 组关键词均无社媒/内容发布相关连接器 |

---

### Phase 3 首发渠道方案

#### 渠道矩阵

| 渠道 | 精力 | 影响 | 类型 | 建议 |
|------|------|------|------|------|
| **Show HN** | ★★★ | ★★★★★ | 一次性 | 必做，开发者工具第一阵地 |
| **Reddit** (3 子版块) | ★★ | ★★★ | 一次性 | 必做，r/opensource + r/selfhosted + r/LocalLLaMA |
| **GitHub Awesome Lists** | ★★ | ★★★★ | 一次性 | 必做，永久反向链接 |
| **Dev.to** | ★★★ | ★★ | 持续 | 做，教程格式 |
| **V2EX** | ★★ | ★★★ | 一次性 | 必做，中文开发者第一站 |
| **掘金** | ★★★ | ★★ | 持续 | 做，教程格式 |
| **Product Hunt** | ★★★★ | ★★ | 一次性 | 可选，ROI 较低，只能手动 |
| **知乎** | ★★ | ★★ | 持续 | 做，回答现有问题 |

#### Show HN 执行要点

- 标题公式：`Show HN: SkillForge – Visual editor for OpenClaw AI agent skills (open source, Tauri)`
- 最佳时间：周六/日 12:00 UTC（北京 20:00），周末突围率比工作日高 20-30%
- 链接指向 GitHub repo（不是官网）
- Maker Comment：4 段（问题/动机/技术栈/求反馈），真诚不营销
- 成功基准：30+ votes = 前 10%，83+ = 前 5%

#### 发布日程

| 时间 | 行动 |
|------|------|
| D-7 | 提交 Awesome List PR；README 加 GIF demo |
| D-3 | 准备 Show HN 标题 + Maker Comment 草稿 |
| D-1 | Dev.to 文章发布（提前索引） |
| D0 周六 20:00 BJT | Show HN → 1h 后 Reddit 3 帖分时段发 |
| D+1 | V2EX + 掘金 |
| D+3 | Product Hunt（可选） |
| D+7 | 知乎 + 第二篇 Dev.to |

#### 发布前必备产出物

| 产出物 | 状态 | 说明 |
|--------|------|------|
| README 顶部 GIF demo | ❌ 缺少 | 录制 30 秒操作 GIF |
| Show HN 标题 + Maker Comment | ❌ 未写 | 草拟文案 |
| Dev.to 教程文章 | ❌ 未写 | "5 分钟配置 AI Agent Skill" |
| Reddit 3 篇定制文案 | ❌ 未写 | r/opensource / r/selfhosted / r/LocalLLaMA |
| V2EX + 掘金文案 | ❌ 未写 | 中文版 |
| Awesome List PR | ❌ 未提交 | awesome-tauri / awesome-ai-agents |
| OG 社交预览图 | ✅ 已有 | 1280×640 |
| SEO 基建 | ✅ 完成 | sitemap / OG / JSON-LD |
| 社交文案自动生成 | ✅ 完成 | social-changelog workflow |

---

### launch-playbook 仓库架构

独立仓库，支持多产品复用：

```
launch-playbook/
  products/
    skillforge.yml              ← 产品配置（名称、描述、链接、受众、差异点）
  templates/
    show-hn.md                  ← Show HN 标题 + Maker Comment 模板
    devto-tutorial.md           ← Dev.to 教程模板
    reddit-post.md              ← Reddit 分版块模板
    v2ex-post.md                ← V2EX 模板
    juejin-post.md              ← 掘金模板
  workflows/
    release-announce.yml        ← 可复制到任意产品仓库的 workflow 模板
  scripts/
    generate-content.mjs        ← product.yml + template → 各渠道文案
    post-to-devto.mjs           ← Dev.to API 发布脚本
  channels/
    channel-matrix.md           ← 渠道矩阵（规则/时间/禁忌）
    launch-calendar-template.md ← 发布日程模板
  docs/
    postiz-setup.md             ← Postiz 自托管指南（后续升级用）
```

为什么独立仓库：
- 营销模板和产品代码关注点不同
- 新产品只需写 `products/xxx.yml`，套模板生成全部文案
- launch-playbook 本身可开源（"how I launch open-source tools"）

---

## 三、新会话执行顺序建议

1. **修复现有 workflow**：release-announce.yml 加 setup-node + Node 22
2. **创建 launch-playbook 仓库**：初始化结构 + skillforge.yml
3. **升级 workflow 为 B-Lite 完整版**：加 Discord/Dev.to/Bluesky/Reddit steps
4. **准备首发产出物**：GIF demo → Show HN 文案 → Dev.to 文章 → Reddit/V2EX/掘金文案
5. **提交 Awesome List PR**
6. **选定日期执行首发**
