---
description: 项目定位、背景、目标用户、技术方向
status: active
last_updated: 2026-04-03
---
# SkillForge — 项目简述

## 项目定位
SkillForge 是一个 **OpenClaw Skill 可视化配置工具**，帮助用户了解、配置和更好地使用 OpenClaw 的 Skill 系统。

核心价值：**将 Skill 的配置从"手工编辑 YAML/JSON/Markdown"变为"可视化表单 + 实时预览"**。

## 项目背景

### 为什么做这个项目
OpenClaw 是 2026 年最热门的开源 AI Agent 框架之一，但其 Skill 系统存在明显痛点：
- Skill 配置复杂，需要手工编辑 SKILL.md、JSON 配置文件
- 依赖关系不透明，调试困难
- 新用户学习门槛高，多数人只用了 10% 的功能
- 没有成熟的可视化工具（竞品 Butlerclaw 只解决了安装部署问题）

### 前期经历
2026-04-01，项目发起人 Jason 在 OpenClaw（飞书对话）上进行了初次尝试：
- OpenClaw 做了大量市场分析、竞品调研、PRD 文档
- 但实际代码产出质量差：4 次重建都有问题，最终只做出了一个"Skill 列表查看器"
- 核心的"可视化配置"功能完全没有实现
- 详细调研发现记录在 `project-harness/context/openclaw-research.md`

### 现在的策略
改用 Cursor 本地 AI 辅助开发，重新从零构建。保持"小任务闭环、可验证、可追溯"的工作节奏。

## 目标用户

| 优先级 | 用户类型 | 核心需求 |
|--------|---------|---------|
| P0 | OpenClaw Skill 开发者 | 降低开发调试成本，可视化配置 |
| P1 | OpenClaw 普通用户 | 降低使用门槛，图形化管理已安装 Skill |
| P2 | 企业 IT 管理员 | 批量配置、安全审计 |

## 产品定位（MVP）

MVP 聚焦 **P0 用户**（Skill 开发者），核心功能：
1. **Skill 解析与展示**：自动解析 SKILL.md 和配置文件，展示 Skill 结构
2. **可视化配置编辑**：表单化编辑配置项，支持 JSON Schema 生成表单
3. **实时预览**：配置变更实时反映到 SKILL.md / JSON 文件
4. **Skill 验证**：检测配置问题、依赖冲突、安全风险

暂不做：工作流设计器、Skill 市场、企业级功能。

## 技术方向（待确认）

以下是建议方向，在第一个任务中需要确认：

- **前端**：React + TypeScript + Tailwind CSS（或 Vue 3，待讨论）
- **后端**：Node.js + Express（或不需要后端，纯前端 + 本地文件系统）
- **部署**：本地运行为主（Electron 或纯 Web + 本地 server）
- **Skill 解析**：自研 parser，解析 SKILL.md（YAML frontmatter + Markdown + 工具定义）

## OpenClaw Skill 系统关键知识

### Skill 目录结构
```
~/.openclaw/workspace/skills/
  └── my-skill/
      ├── SKILL.md          # 核心文件：技能描述 + 工具定义 + 指令
      ├── config/            # 可选：配置文件目录
      │   └── defaults/
      │       └── sources.json
      ├── tests/             # 可选：测试
      ├── _meta.json         # 可选：元数据
      └── CHANGELOG.md       # 可选：变更日志
```

### SKILL.md 结构
```markdown
---
name: my-skill
description: "技能描述"
version: 1.0.0
---

# 技能名称

技能的详细说明...

## Tools

### tool_name
描述：工具用途
参数：
- param1: string - 参数说明
- param2: number - 参数说明
```

### 已知的 Skill 示例（来自 Jason 的 OpenClaw 实例）
服务器上有 18 个已安装 Skill，包括：
- agent-browser、deep-writing、tech-news-digest、url-reader
- tiered-memory、task-decomposer、video-generate 等
- 其中 tech-news-digest 有完整的 config 体系（sources.json、topics.json）

## 与 Youqu_V0.2 的关系
- SkillForge 是**独立项目**，与 Youqu_V0.2（有趣 App）无技术关联
- 但借鉴了 Youqu_V0.2 的项目治理方法（harness 机制），保持小任务闭环
- Jason 的 OpenClaw 服务器可通过 `ssh openclaw` 访问，用于获取真实 Skill 数据

## 协作要求
- 每次只做 `project-harness/workflow/active-task.md` 中定义的一个任务
- 任务结束必须更新 `current-state.md` 和写 task-log
- 遇到问题立即报告，不静默降级
- 代码优先于文档——先做能跑的东西，再补文档
