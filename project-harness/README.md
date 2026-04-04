# Project Harness — 使用说明

## 文件结构

```
project-harness/
├── context/
│   ├── project-brief.md       项目定位、背景、目标用户、技术方向
│   ├── current-state.md       会话交接页（进度、环境状态、下一步）
│   ├── openclaw-research.md   OpenClaw 对话中的调研发现（竞品、痛点、教训）
│   └── references.md          调研参考资料（含对比决策记录）
├── workflow/
│   └── backlog.md             待办清单（唯一的任务管理文件）
├── evidence/
│   └── task-logs/             每次任务完成后的日志
└── README.md                  ← 你正在看的这个文件
```

## 每个文件解决什么问题


| 文件                             | AI 读后会知道什么                  | 谁来更新       | 何时更新 |
| ------------------------------ | --------------------------- | ---------- | ---- |
| `context/project-brief.md`     | 项目是什么、为什么做、目标用户、技术方向        | 人工（方向变更时）  | 低频   |
| `context/current-state.md`     | 做到哪了、环境怎么访问、子 Agent 委派经验    | AI（每次对话结束） | 每次   |
| `context/openclaw-research.md` | 竞品分析、用户痛点、前次失败教训            | 人工（有新调研时）  | 低频   |
| `context/references.md`        | 调研参考资料（含"选了什么、对比了什么、为什么不选"） | AI（调研时记录）  | 有调研时 |
| `workflow/backlog.md`          | 待办清单、当前任务、已完成历史             | AI（每次对话结束） | 每次   |
| `evidence/task-logs/*.md`      | 每次任务做了什么、调研了什么、子 Agent 质量如何 | AI（任务完成时）  | 每次   |


## 治理规则在哪里

`.cursor/rules/` 下有两个规则文件（均 `alwaysApply: true`，自动生效）：


| 规则文件                      | 管什么                                      |
| ------------------------- | ---------------------------------------- |
| `session-governor.mdc`    | 任务流程：读上下文 → 按批次执行 → 验证 → 收尾交接（4 项必做）     |
| `research-driven-dev.mdc` | 调研纪律：四个核心环节必须先搜索；豁免条件明确；task-log 必须含调研记录 |


`session-governor` 还包含：

- **模型分工策略**（Opus 主控 + fast 子 Agent 写代码）
- **收尾清单**（4 项必做：current-state + backlog + task-log + 下一步建议）
- **task-log 模板**（含必填的"调研记录"小节）

## 新对话怎么启动

打开 SkillForge 项目后，对 AI 说：

> "读取 project-harness 下的上下文文件，然后开始执行 backlog.md 中的当前任务。"

## 这套机制的来源

借鉴自 Youqu_V0.2 项目的 harness 治理体系，针对 SkillForge 做了轻量化裁剪和优化：

- 去掉了 Figma 相关规则
- 去掉了三层验收中的"数据一致性"层（不涉及设计稿）
- 用 `backlog.md` 取代 `active-task.md`，减少维护文件数
- 保留了核心的"读上下文 → 按任务执行 → 验证 → 汇报 → 交接"流程
- 强化了调研纪律的执行保障（豁免条件 + task-log 必填调研记录）
- 增加了子 Agent 委派经验的积累机制

