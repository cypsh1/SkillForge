---

## description: 任务待办清单（唯一的任务管理文件）

status: active
last_updated: 2026-04-07

# Backlog

> 所有待办、进行中、已完成的任务统一管理在此文件。
> AI 每次对话收尾时必须更新本文件。

## 当前任务

无当前任务。请从待办中选择下一个任务。

### T1 实施建议（基于 T0 调研）

**核心发现**：80% 的 Skill 编辑需求集中在 SKILL.md frontmatter。config/ 目录虽复杂但极稀少（6%）。

**分层策略**：

1. **第一层（P0）**：Frontmatter 结构化编辑器 — 内置 schema，覆盖所有 frontmatter 字段
2. **第二层（P1）**：Config 目录编辑器 — 当有 schema.json 时自动生成表单，无 schema 时键值编辑
3. **第三层（P2）**：文件浏览器 — scripts/、references/ 等只读浏览

**技术选型待调研**：react-jsonschema-form vs @jsonforms/react vs 自研

**调研报告**：`project-harness/evidence/skill-structure-analysis.md`

## 待办

### 对齐修复（基准：`demo-05-alignment-checklist.md`）

| ID | 优先级 | 名称 | 涉及文件 | 备注 |
|---|---|---|---|---|
| ~~Batch 1~~ | ~~P0~~ | ~~主题系统对齐（A1×6 + A5-1）~~ | ~~`index.css` 等 7 文件~~ | ~~✅ 已完成 2026-04-07~~ |
| ~~Batch 2~~ | ~~P0~~ | ~~区块交互对齐（A2×4）~~ | ~~`editor-panel.tsx` / `inspector-panel.tsx`~~ | ~~✅ 已完成 2026-04-07~~ |
| ~~Batch 3~~ | ~~P0~~ | ~~桥线+气泡对齐（A3×2 + A4×3）~~ | ~~`bridge-connector.tsx` / `relation-hover.tsx`~~ | ~~✅ 已完成 2026-04-07~~ |
| ~~Batch 4~~ | ~~P0~~ | ~~B 类决策执行~~ | ~~`editor-panel.tsx` / `inspector-panel.tsx`~~ | ~~✅ 已完成 2026-04-07~~ |
| ~~Batch 5~~ | ~~P1~~ | ~~运行时确认+产品决策~~ | ~~多个~~ | ~~✅ 已完成 2026-04-07~~ |

### 交互细节待确认

| ID | 优先级 | 名称 | 说明 |
|---|---|---|---|
| ~~UX-1~~ | ~~P2~~ | ~~左进度条颜色~~ | ~~已决定：保留主应用区块跟随色。理由：三栏布局信息密度更高，跟随色传达上下文归属。~~ |
| UX-2 | P2 | Tauri 保存按钮 | 右面板头部的"保存"按钮（仅桌面端可见），点击后写回本地文件。需确认交互细节（保存成功/失败提示时长、按钮状态等）。 |
| UX-3 | P2 | "已修改"标签 | 右面板头部的琥珀色"已修改"徽章，编辑内容后出现。需确认出现/消失时机、与保存按钮的联动是否顺畅。 |

### 功能开发

| ID  | 优先级 | 名称               | 备注                                                  |
| --- | --- | ---------------- | --------------------------------------------------- |
| T2  | P1  | 代码分割             | 670KB JS 包体积，React.lazy + 动态 import                 |
| T8  | P2  | 左侧文档正文展开         | 左侧"文档结构"区块目前只显示章节标题，不显示正文内容（代码块、步骤说明等）。需确认产品方向：① 点击标题展开该章节正文；② 在新面板/抽屉中渲染完整 markdown；③ 维持现状（正文只在右侧原文区块查看）。 |
| T3  | P1  | 远程 SSH Skill 加载  | 直接连接 OpenClaw 服务器读取/写回 Skill                        |
| T4  | P2  | 配置 Diff          | 对比编辑前后的变更                                           |
| T5  | P2  | 拖拽排序             | sources/topics 列表项拖拽重排                              |
| T6  | P2  | 批量操作             | 多 Skill 批量导出/验证                                     |
| T7  | P3  | Tauri 自动更新       | 桌面应用自动检查和安装更新                                       |

## 流程改进待讨论

| ID | 名称 | 说明 |
| --- | --- | --- |
| P-1 | Demo 先行开发流程 | 新功能/新交互先在独立 demo HTML 中验证，确认后再产品化接入主应用。目的：降低翻译走样风险，保持快速迭代。需讨论：适用范围、demo 何时算"确认"、产品化的标准流程。 |
| P-2 | 执行者验收闭环 | D2 复盘发现：执行者把"落地范围 3 项"当成完整工作清单，做完即收工，没有回头对照 05-complete 做整体视觉验收。需讨论：如何在 harness 机制中确保"落地范围"完成后仍要对照最终基准验收，而不是范围即终点。 |
| P-3 | ✅ Demo 行为规格 | 已完成：`project-harness/evidence/demo-05-behavior-spec.md`（15 章，覆盖结构/样式/交互/数据映射/主题配色） |
| P-4 | 有意差异清单 | Demo 与主应用存在若干有意不同之处（布局机制：CSS Grid vs react-resizable-panels；导航面板：demo 无 vs 主应用三栏；数据：hardcode vs 动态）。当前 3 条，暂不单独建文件；若后续增多再考虑持久化维护。注：主题已决定对齐 demo 纯暗色方案，不再作为有意差异。 |
| P-5 | ✅ 对齐清单 | 已完成：`project-harness/evidence/demo-05-alignment-checklist.md`（A/B/C/D/P 五层分类，经两轮 review 压实） |
| P-6 | 复杂问题多模型交叉 Review | 当问题复杂、分歧大或风险高时，引入多模型并行分析 + 相互 review 的机制：主模型负责拆题与裁决，辅助模型分别产出方案/质疑/审查意见，最后沉淀为可执行结论，避免单模型盲点。 |
| P-7 | 分批任务自动串行执行 | 已梳理好的分批任务（如 Batch 1/2/3…），如何自动串行执行，减少人工逐次启动开销。**方案草案**：① 半自动（现在可做）：新增 `execution-queue.md` 结构化定义每个 batch 的目标/指令/验收，修改 session-governor 支持"继续"一词触发自动拾取下一个 pending batch；② 全自动（待 Cursor CLI/Background Agent 成熟）：外部脚本循环调用 Cursor agent，无人值守串行；③ 推荐分两步走：先落地①，再叠加②。 |


## 已完成


| ID      | 名称                                        | 完成日期       | task-log                                                    |
| ------- | ----------------------------------------- | ---------- | ----------------------------------------------------------- |
| Phase 1 | 技术选型 + 骨架 + SKILL.md 解析器 + 配置编辑器 MVP      | 2026-04-03 | `evidence/task-logs/2026-04-03-phase1.md`                   |
| Phase 2 | Frontmatter 编辑器、Topics 编辑器、导出、验证器、暗色模式    | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md`                 |
| Phase 3 | 扩展 8 个 Skill、Schema 查看器、错误边界、README       | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md`                 |
| Phase 4 | 三栏布局、Tauri 桌面封装、本地 Skill 加载、创建向导          | 2026-04-03 | `evidence/task-logs/2026-04-03-phase4.md`                   |
| D1      | Demo 交互方案验证（01-05 全系列）                    | 2026-04-05 | `evidence/task-logs/2026-04-05-demo-optimization.md`        |
| T0      | Skill 内容结构调研                              | 2026-04-05 | `evidence/task-logs/2026-04-05-skill-structure-research.md` |
| T1      | Frontmatter 结构化编辑器 + i18n                 | 2026-04-06 | `evidence/task-logs/2026-04-06-t1-frontmatter-form.md`      |
| D2      | Demo 方案落地到主应用（桥线+滚动同步+上下文栏）               | 2026-04-06 | `evidence/task-logs/2026-04-06-d2-bridge-landing.md`        |
| D3      | 可视化面板对齐 Demo（7 区块 + 源码预览重构 + collapsible） | 2026-04-06 | `evidence/task-logs/2026-04-06-d3-panel-alignment.md`       |
| D2-BUG  | D2 阶段 bugfix：双面板默认等宽修复                     | 2026-04-06 | `evidence/task-logs/2026-04-06-d2-panel-width-hotfix.md`    |
| D4      | `05-complete` 对齐 + 方案 C 面板重写 + 关系全面动态化 | 2026-04-06 | `evidence/task-logs/2026-04-06-d4-plan-c-panel-rewrite.md`  |
| D5      | Demo 全页面视觉对齐（4 批次） | 2026-04-06 | `evidence/task-logs/2026-04-06-d5-visual-alignment.md`  |
| D5-BUG  | Inspector basic 预览间距 hotfix | 2026-04-06 | `evidence/task-logs/2026-04-06-d5-inspector-basic-spacing-hotfix.md`  |
| D5-BUG2 | Inspector 字段级镜像映射补齐 | 2026-04-06 | `evidence/task-logs/2026-04-06-d5-inspector-field-mapping-hotfix.md`  |
| P-3     | 执行复盘 + Demo 行为规格产出 | 2026-04-07 | `evidence/task-logs/2026-04-07-retrospective-and-behavior-spec.md` |
| P-5     | 对齐清单产出 + 两轮 review 压实 | 2026-04-07 | `evidence/demo-05-alignment-checklist.md` |
| Batch 1 | 主题系统对齐（A1×6 + A5-1） | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b1-theme-alignment.md` |
| Batch 2 | 区块交互对齐（A2×4） | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b2-block-interaction.md` |
| Batch 3 | 桥线+气泡对齐（A3×2 + A4×3） | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b3-bridge-bubble.md` |
| Batch 4 | B 类决策执行（B1 + D4-D6 确认） | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b4-b-class-decision.md` |
| Batch 5 | 运行时确认+产品决策（C 类验证 + P1 决定） | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b5-runtime-verification.md` |
