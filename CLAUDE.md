# SkillForge — Claude Code 项目规则

SkillForge 是 OpenClaw Skill 可视化配置桌面工具（Tauri v2 + React 19 + TypeScript）。

## 启动规则

开始任何实现前，必须先读取：
1. `project-harness/context/current-state.md`（当前进度和下一步）
2. `project-harness/workflow/backlog.md`（任务清单）

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

## 禁止行为

- 未读上下文直接改代码
- 花大量时间写分析报告而不产出代码
- 未验证就声称"已完成"
- 收尾时跳过任何一项收尾清单
