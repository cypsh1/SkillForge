# SkillForge — Claude Code 项目规则

SkillForge 是 OpenClaw Skill 可视化配置桌面工具（Tauri v2 + React 19 + TypeScript）。

## 启动规则

开始任何实现前，必须先读取：
1. `project-harness/context/working-draft.md`（是否有未完成的讨论/方案存档）
2. `project-harness/context/current-state.md`（当前进度和下一步）
3. `project-harness/workflow/backlog.md`（任务清单）

如果 working-draft.md 中有存档内容，优先提示用户："上次有未完成的讨论，是否继续？"
如果 backlog.md 中有"当前任务"，直接开始执行。如果没有，提醒用户从待办中选择。

需要了解项目背景时，按需读取：
- `project-harness/context/project-brief.md`（项目定位和目标用户）
- `project-harness/context/references.md`（技术选型和参考资料）
- `project-harness/evidence/project-history.md`（完整项目发展历程）

## 执行闸门

每完成一个批次，必须通过以下全部检查才能继续下一步：
1. `npx tsc -b --noEmit` 无错误
2. `npm run build` 构建成功
3. 浏览器验证：新功能可见可用
4. 如果 backlog 标注了验收标准，逐项对照

任何一项未通过则停止修复，不跳到下一步。

## 收尾规则

对话结束前必须完成以下全部 4 项：
1. 更新 `project-harness/context/current-state.md`（当前进度 + 下一步）
2. 更新 `project-harness/workflow/backlog.md`（完成的标完成，新发现的加入待办）
3. 在 `project-harness/evidence/task-logs/` 下写任务日志
4. 给出下一步建议

## 调研纪律

以下环节必须先搜索再编码（3-5 次搜索以内）：
- 新功能开发（backlog 中定义的新功能）
- 引入新依赖（安装新的 npm 包）
- 新的交互模式（之前没做过的 UI 交互）

可以跳过调研的情况：纯 Bug 修复、样式微调、已有技术栈内的重复模式。
跳过时在 task-log 中注明原因。

搜索结果必须转化为可执行的决策，不停留在"调研报告"层面。
发现重要参考时记录到 `project-harness/context/references.md`。

## 沟通风格

描述技术问题时，用用户能看到的现象来说明，不要用代码字段或内部变量名。
例如：说"打开 config 文件后右侧只显示原始 JSON 文本"，不说"JsonPreview 组件没有 data-bridge-section 属性"。

## 远程资源

- OpenClaw 服务器：`ssh openclaw`
  - Skill 目录：`/root/.openclaw/workspace/skills/`

## 会话存档机制

### 中间态存档

当讨论、方案制定等工作尚未完成但需要切换会话时，将当前状态存入 `project-harness/context/working-draft.md`。

存档内容必须包括：
- **讨论的核心问题**：这次讨论要解决什么
- **已探讨的方案**：每个方案的要点和优劣
- **当前倾向**：倾向哪个方向，为什么
- **未解决的问题**：还有哪些没想清楚
- **下一步**：新会话第一件事做什么

用户说"存档"时立即执行。任务正式完成后清空 working-draft.md，结论沉淀到对应的 harness 文件。

### 会话切换自动提示

当发现需要**重新读取**本会话早期已读过的文件时（说明上下文已被压缩），主动提示用户考虑存档切换。

提示格式固定为：

> **会话检查点** — 上下文已被压缩（需要重读早期文件），建议存档后开新会话继续。说"存档"我会保存当前进度。

用户确认"存档"后执行存档流程。用户选择继续则继续工作，不再重复提示。

## 禁止行为

- 未读上下文直接改代码
- 花大量时间写分析报告而不产出代码
- 未验证就声称"已完成"
- 收尾时跳过任何一项收尾清单
