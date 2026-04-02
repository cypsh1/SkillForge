# Project Harness — 使用说明

## 文件结构

```
project-harness/
├── context/
│   ├── project-brief.md       项目定位、背景、目标用户、技术方向
│   ├── current-state.md       会话交接页（进度、环境状态、下一步）
│   └── openclaw-research.md   OpenClaw 对话中的调研发现（竞品、痛点、教训）
├── workflow/
│   └── active-task.md         当前任务定义（批次计划、验收标准）
├── evidence/
│   └── task-logs/             每次任务完成后的日志
├── review/                    评审相关（待后续补充）
└── README.md                  ← 你正在看的这个文件
```

## 每个文件解决什么问题

| 文件 | AI 读后会知道什么 | 谁来更新 |
|------|------------------|---------|
| `context/project-brief.md` | 项目是什么、为什么做、目标用户、技术方向、OpenClaw Skill 系统结构 | 人工（方向变更时） |
| `context/current-state.md` | 当前做到哪了、环境怎么访问、下一步干什么 | AI（每次对话结束） |
| `context/openclaw-research.md` | 竞品 Butlerclaw 分析、用户痛点、市场数据、前次失败教训 | 人工（有新调研时） |
| `context/references.md` | 调研中发现的产品/技术/设计参考资料 | AI（调研时自动记录） |
| `workflow/active-task.md` | 当前任务的批次计划、验收标准、风险点 | AI（任务推进时勾选） |
| `evidence/task-logs/*.md` | 每次任务做了什么、结果如何、发现了什么问题 | AI（任务完成时） |

## 治理规则在哪里

`.cursor/rules/` 下有两个规则文件（均 `alwaysApply: true`，自动生效）：

| 规则文件 | 管什么 |
|---------|--------|
| `session-governor.mdc` | 任务流程：读上下文 → 按批次执行 → 验证 → 收尾交接 |
| `research-driven-dev.mdc` | 调研纪律：四个核心环节（产品/功能/交互/技术）必须先搜索再做 |

`session-governor` 还包含**模型分工策略**（Opus 主控 + fast 子 Agent 写代码）。

## 新对话怎么启动

打开 SkillForge 项目后，对 AI 说：

> "读取 project-harness 下的上下文文件，然后开始执行 active-task.md 中的任务。"

## 这套机制的来源

借鉴自 Youqu_V0.2 项目的 harness 治理体系，针对 SkillForge 做了轻量化裁剪：
- 去掉了 Figma 相关规则
- 去掉了三层验收中的"数据一致性"层（不涉及设计稿）
- 保留了核心的"读上下文 → 按任务执行 → 验证 → 汇报 → 交接"流程
