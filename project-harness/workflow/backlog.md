---

## description: 任务待办清单（唯一的任务管理文件）

status: active
last_updated: 2026-04-05

# Backlog

> 所有待办、进行中、已完成的任务统一管理在此文件。
> AI 每次对话收尾时必须更新本文件。

## 当前任务


| ID  | 名称          | 状态  | 备注                                        |
| --- | ----------- | --- | ----------------------------------------- |
| D1  | Demo 交互方案验证 | 进行中 | 04-panel-alignment 已完成，待决定是否继续迭代或开始落地到主应用 |


## 待办


| ID  | 优先级 | 名称               | 备注                                                    |
| --- | --- | ---------------- | ----------------------------------------------------- |
| D2  | P0  | Demo 方案落地到主应用    | 将 demo 中验证的设计（桥线、滚动同步、关系可视化）实装到 inspector-panel 等组件   |
| T1  | P0  | JSON Schema 驱动表单 | 核心能力：根据 schema.json 自动生成编辑表单，替代硬编码的 sources/topics 表单 |
| T2  | P1  | 代码分割             | 670KB JS 包体积，React.lazy + 动态 import                   |
| T3  | P1  | 远程 SSH Skill 加载  | 直接连接 OpenClaw 服务器读取/写回 Skill                          |
| T4  | P2  | 配置 Diff          | 对比编辑前后的变更                                             |
| T5  | P2  | 拖拽排序             | sources/topics 列表项拖拽重排                                |
| T6  | P2  | 批量操作             | 多 Skill 批量导出/验证                                       |
| T7  | P3  | Tauri 自动更新       | 桌面应用自动检查和安装更新                                         |


## 已完成


| ID      | 名称                                     | 完成日期       | task-log                                    |
| ------- | -------------------------------------- | ---------- | ------------------------------------------- |
| Phase 1 | 技术选型 + 骨架 + SKILL.md 解析器 + 配置编辑器 MVP   | 2026-04-03 | `evidence/task-logs/2026-04-03-phase1.md`   |
| Phase 2 | Frontmatter 编辑器、Topics 编辑器、导出、验证器、暗色模式 | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md` |
| Phase 3 | 扩展 8 个 Skill、Schema 查看器、错误边界、README    | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md` |
| Phase 4 | 三栏布局、Tauri 桌面封装、本地 Skill 加载、创建向导       | 2026-04-03 | `evidence/task-logs/2026-04-03-phase4.md`   |


