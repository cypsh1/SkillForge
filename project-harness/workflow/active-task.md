---
description: 当前任务唯一进度源
status: active
last_updated: 2026-04-03
---
# Active Task

## 任务名称
Phase 1：技术选型 + 项目骨架 + SKILL.md 解析器

## 状态
**待开始**

## 任务概述
从零搭建 SkillForge 项目，确认技术栈，实现核心解析能力，做出第一个可用的 Skill 列表页面。

## 批次计划

| 批次 | 内容 | 产出 | 状态 |
|:---:|------|------|:---:|
| 1.1 | 技术选型确认 + 项目初始化 | package.json、tsconfig、构建配置 | [ ] |
| 1.2 | SKILL.md 解析器 | 能解析 frontmatter + 工具定义 + 配置文件 | [ ] |
| 1.3 | 基础 UI 框架 | 布局骨架、Skill 列表页 | [ ] |
| 1.4 | Skill 详情页 | 展示解析后的 Skill 结构信息 | [ ] |
| 1.5 | 配置编辑器（MVP） | 能编辑简单配置项并预览 | [ ] |

## 执行顺序

```
Phase 1
  → 1.1 技术选型 + 初始化 → git init + first commit
  → 1.2 SKILL.md 解析器（核心）→ 单元测试通过 → git commit
  → 1.3 基础 UI 框架 → 能在浏览器中看到页面 → git commit
  → 1.4 Skill 详情页 → 能查看解析后的信息 → git commit
  → 1.5 配置编辑器 → 能编辑并预览 → git commit
```

## 技术选型待确认项

| 决策点 | 选项 A | 选项 B | 建议 |
|--------|--------|--------|------|
| 前端框架 | React + TypeScript | Vue 3 + TypeScript | 都可以，React 生态更大 |
| UI 组件库 | shadcn/ui (React) | Ant Design | shadcn 更轻量现代 |
| 构建工具 | Vite | Next.js | Vite 更轻量，MVP 不需要 SSR |
| 后端 | Express.js | 无后端（纯前端） | MVP 可先纯前端 + 本地文件 |
| Skill 数据源 | 读取本地 ~/.openclaw/ | SSH 远程读取 | 先支持本地，后续加远程 |

## 测试数据
- 可从 `ssh openclaw` 的 `/root/.openclaw/workspace/skills/` 复制 2-3 个 Skill 作为本地测试数据
- 推荐复制：`weather`（简单）、`url-reader`（中等）、`tech-news-digest`（复杂）

## 验收标准
1. 项目能 `npm run dev` 启动
2. 浏览器能看到 Skill 列表
3. 点击 Skill 能看到解析后的详细信息（名称、描述、工具列表、参数）
4. 至少能编辑一个简单配置项并看到预览

## 风险点
1. SKILL.md 格式不统一，解析器需要足够健壮
2. 技术选型讨论可能消耗时间——建议快速决定，不过度纠结
3. 首次搭建新项目时需注意不要过度设计
