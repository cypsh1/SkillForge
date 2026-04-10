# Project Harness — 使用说明

## 文件结构

```
project-harness/
├── context/
│   ├── project-brief.md       项目定位、背景、目标用户、技术方向
│   ├── current-state.md       会话交接页（当前进度、下一步、环境状态）
│   ├── openclaw-research.md   OpenClaw 对话中的调研发现（竞品、痛点、教训）
│   └── references.md          调研参考资料（含对比决策记录）
├── workflow/
│   ├── backlog.md             待办清单（唯一的任务管理文件）
│   └── v1.1-unified-batches.md  V1.1-UNIFIED 批次计划（已完成，归档）
├── evidence/
│   ├── project-history.md     完整项目发展历程（按需查阅，不自动加载）
│   ├── demo-05-*.md           Demo 行为规格和对齐清单
│   ├── skill-structure-analysis.md  Skill 结构调研报告
│   └── task-logs/             每次任务完成后的日志
├── docs/
│   └── v1-product-tech-spec.md  V1 产品技术规格
└── README.md                  ← 你正在看的这个文件
```

## 每个文件解决什么问题

| 文件 | AI 读后会知道什么 | 谁来更新 | 何时更新 |
|---|---|---|---|
| `context/project-brief.md` | 项目是什么、为什么做、目标用户、技术方向 | 人工（方向变更时） | 低频 |
| `context/current-state.md` | 做到哪了、环境怎么访问、下一步做什么 | AI（每次对话结束） | 每次 |
| `context/references.md` | 调研参考资料（含对比决策记录） | AI（调研时记录） | 有调研时 |
| `workflow/backlog.md` | 待办清单、当前任务、已完成历史 | AI（每次对话结束） | 每次 |
| `evidence/project-history.md` | 项目从 Phase 1 到现在的完整发展历程 | AI（里程碑完成时） | 低频 |
| `evidence/task-logs/*.md` | 每次任务做了什么、调研了什么 | AI（任务完成时） | 每次 |

## 治理规则在哪里

项目根目录的 `CLAUDE.md` 文件定义了 AI 的行为规则，每次会话自动加载。包括：

- **启动规则**：先读 current-state + backlog，再开始执行
- **执行闸门**：tsc + build + 浏览器验证
- **收尾清单**：更新 current-state + backlog + task-log + 下一步建议
- **调研纪律**：新功能/新依赖/新交互必须先搜索再编码

> 注：`.cursor/rules/` 下的 `.mdc` 文件是 Cursor 时代的遗留规则，Claude Code 不读取。保留仅供参考。

## 新对话怎么启动

打开 SkillForge 项目后，对 AI 说：

> **"开始当前任务"**

AI 会自动从 CLAUDE.md 获取规则，从 backlog.md 读取当前任务，开始执行。
