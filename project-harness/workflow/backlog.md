---

## description: 任务待办清单（唯一的任务管理文件）

status: active
last_updated: 2026-04-06

# Backlog

> 所有待办、进行中、已完成的任务统一管理在此文件。
> AI 每次对话收尾时必须更新本文件。

## 当前任务

无活跃任务，从待办中选择下一个。


### T1 实施建议（基于 T0 调研）

**核心发现**：80% 的 Skill 编辑需求集中在 SKILL.md frontmatter。config/ 目录虽复杂但极稀少（6%）。

**分层策略**：
1. **第一层（P0）**：Frontmatter 结构化编辑器 — 内置 schema，覆盖所有 frontmatter 字段
2. **第二层（P1）**：Config 目录编辑器 — 当有 schema.json 时自动生成表单，无 schema 时键值编辑
3. **第三层（P2）**：文件浏览器 — scripts/、references/ 等只读浏览

**技术选型待调研**：react-jsonschema-form vs @jsonforms/react vs 自研

**调研报告**：`project-harness/evidence/skill-structure-analysis.md`

## 待办


| ID  | 优先级 | 名称               | 备注                                                                  |
| --- | --- | ---------------- | ------------------------------------------------------------------- |
| D2  | P0  | Demo 方案落地到主应用    | 将 demo 中验证的设计（桥线、滚动同步、关系可视化）实装到 inspector-panel 等组件                 |
| T1  | ✅  | JSON Schema 驱动表单 | P0 frontmatter 编辑器 + i18n 已完成；P1 config schema 表单待做 |
| T2  | P1  | 代码分割             | 670KB JS 包体积，React.lazy + 动态 import                                 |
| T3  | P1  | 远程 SSH Skill 加载  | 直接连接 OpenClaw 服务器读取/写回 Skill                                        |
| T4  | P2  | 配置 Diff          | 对比编辑前后的变更                                                           |
| T5  | P2  | 拖拽排序             | sources/topics 列表项拖拽重排                                              |
| T6  | P2  | 批量操作             | 多 Skill 批量导出/验证                                                     |
| T7  | P3  | Tauri 自动更新       | 桌面应用自动检查和安装更新                                                       |


## 已完成


| ID      | 名称                                     | 完成日期       | task-log                                             |
| ------- | -------------------------------------- | ---------- | ---------------------------------------------------- |
| Phase 1 | 技术选型 + 骨架 + SKILL.md 解析器 + 配置编辑器 MVP   | 2026-04-03 | `evidence/task-logs/2026-04-03-phase1.md`            |
| Phase 2 | Frontmatter 编辑器、Topics 编辑器、导出、验证器、暗色模式 | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md`          |
| Phase 3 | 扩展 8 个 Skill、Schema 查看器、错误边界、README    | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md`          |
| Phase 4 | 三栏布局、Tauri 桌面封装、本地 Skill 加载、创建向导       | 2026-04-03 | `evidence/task-logs/2026-04-03-phase4.md`            |
| D1      | Demo 交互方案验证（01-05 全系列）                 | 2026-04-05 | `evidence/task-logs/2026-04-05-demo-optimization.md` |
| T0      | Skill 内容结构调研                             | 2026-04-05 | `evidence/task-logs/2026-04-05-skill-structure-research.md` |
| T1      | Frontmatter 结构化编辑器 + i18n              | 2026-04-06 | `evidence/task-logs/2026-04-06-t1-frontmatter-form.md` |
