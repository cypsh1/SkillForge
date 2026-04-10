---
description: 任务待办清单（唯一的任务管理文件）
status: active
last_updated: 2026-04-10
---

# Backlog

> 所有待办、进行中、已完成的任务统一管理在此文件。
> AI 每次对话收尾时必须更新本文件。

## ID 命名规则

- **V1-N**：V1.0 活跃任务（数字 = 执行顺序）
- **V1-BUG**：V1.0 Bug 修复批次
- **V1-UX**：V1.0 发布前 UX 优化
- **V1.1-XXX**：V1.1 任务
- **P-N**（带横杠）：流程改进讨论项（非执行任务）

## 当前任务

**V1.1-STYLE-UNIFY：跨文件类型展示与编辑一致性**

来源：用户排查发现 config 文件（sources.json / topics.json / schema.json）的编辑和预览面板与 SKILL.md 风格不一致——打开 SKILL.md 是紧凑、有联动的专业界面，切到 config 文件变成另一种卡片布局，不像同一个产品。

详细方案：`.claude/plans/staged-humming-teapot.md`

### 执行计划

| Phase | 名称 | 内容 | 状态 |
|---|---|---|---|
| A | 编辑面板容器统一 | config 文件编辑区包裹统一容器（彩色边框、折叠、编辑按钮），统计摘要行样式对齐 | 待执行 |
| B | 预览面板结构化 + 桥线联动 | config 文件预览从原始 JSON 文本升级为分段预览，打通左右面板桥线 | 待执行 |
| C | 清理 + 嵌套 JSON 修复 | 删除废弃旧页面代码；修复嵌套 JSON 编辑丢失层级问题 | 待执行 |

### 验收标准

- [ ] config 文件编辑面板有彩色左边框、折叠按钮，与 SKILL.md 风格统一
- [ ] config 文件预览面板有结构化分段，不再是原始 JSON 文本
- [ ] 左右面板桥线联动对 config 文件生效（跳转、折叠同步）
- [ ] 嵌套 JSON 编辑不丢失数据
- [ ] 废弃旧页面代码已清理
- [ ] tsc ✅ build ✅

---

## 最近完成

| ID | 名称 | 完成日期 | 说明 |
|---|---|---|---|
| V1.1-SCHEMA-EDIT | schema.json 可编辑 | 2026-04-10 | SchemaRawEditor（SectionBlock + textarea + JSON 校验） |
| V1.1-DATA | 测试数据全量同步 + 加载器重构 | 2026-04-09 | rsync 18 个 Skill + import.meta.glob + tauri extra files |
| V1.1-UNIFIED | Markdown 正文统一 B1-B5 | 2026-04-09 | SectionBlock 公共组件 + FragmentBlock + 四分类路由 |
| V1-UX | 发布前 UX 优化 | 2026-04-08 | #18 #19 #4+ #22 #1 #8 完成；#15 #16 推迟 V1.1 |
| V1-5 | 代码分割 | 2026-04-08 | 首屏 JS 1235→243KB（-80%） |
| V1-4 | 保存流程闭环 | 2026-04-08 | sonner toast + dirty 状态 + extra files 保存 |
| V1-BUG | Bug 修复批次 | 2026-04-08 | #5 #9 #10 #14 |

详细执行记录见 `evidence/task-logs/` 和 `evidence/project-history.md`。

---

## V1.0 状态

**V1.0 路线图全部完成。**

已完成：Phase 1-4 + V1-1 ~ V1-5 + V1-BUG + V1-UX + V1-UX-FIX + V1-LAYOUT

---

## V1.1 待办

| ID | 名称 | 来源 | 说明 |
|---|---|---|---|
| **V1.1-STYLE-UNIFY** | **跨文件类型展示与编辑一致性** | 用户反馈 | **进行中** — 方案：`.claude/plans/staged-humming-teapot.md` |
| V1.1-向导 | 创建向导整合 | #2 | 4 模板合并为单入口 + 可选"从模板预填" |
| V1.1-子节点删除 | 子节点删除支持 | #3 | 目录子节点（config 文件等）支持删除 |
| V1.1-文档编辑 | 文档结构可编辑 | #6 | doc/exec 区块从只读变为可编辑 |
| V1.1-配色 | 配色方案优化 | #7 | 两个方向待选：优化彩色 / 深紫主题 |
| V1.1-修改追踪 | 修改追踪增强 | #11 | 记录修改数量/位置/筛选 |
| V1.1-在线导入 | ClawHub / GitHub 在线导入 | — | 从 ClawHub 搜索导入 + GitHub URL 导入 |
| V1.1-SSH | 远程 SSH Skill 加载 | — | 连接 OpenClaw 服务器读写 |
| V1.1-主题 | 深色/亮色主题切换 | — | 先产出 light mode demo 验证色值 |
| V1.1-Diff | 配置 Diff | — | 对比编辑前后变更 |
| V1.1-拖拽 | 拖拽排序 | — | sources/topics 列表拖拽重排 |
| V1.1-批量 | 批量操作 | — | 多 Skill 批量导出/验证 |
| V1.1-更新 | Tauri 自动更新 | — | 桌面应用自动更新 |
| V1.1-跨文件校验 | 跨文件联动校验 | #3b | 文件之间的依赖/引用关系校验 |
| V1.1-代码联动 | 代码文件桥连/联动增强 | #23 | 左侧字段 hover 高亮右侧对应代码行 |
| ~~V1.1-统一解析~~ | ~~统一解析/展示/编辑架构~~ | #24 | ✅ 已在 V1.1-UNIFIED 中完成 |
| V1.1-标题编辑 | 子区块标题编辑+预览同步 | #15 | 从 V1-UX 推迟 |
| V1.1-编辑校验 | SKILL.md 编辑后校验 | #16 | 从 V1-UX 推迟 |

## V2.0 待办

| ID | 名称 | 来源 | 说明 |
|---|---|---|---|
| V2.0-账户 | 账户系统 + 用户数据存储 | #12 | 需要后端服务。V1.0 以本地产品形式发布，不含账户 |
| V2.0-Onboarding | 新用户引导 + 预设技能 | #13 | 依赖账户系统 |

---

## 执行策略（复盘防护）

1. **Demo 先行**（P-1）：涉及新交互的任务编码前先产出 demo
2. **翻译方向**（L1）：从 demo HTML 结构出发写 JSX
3. **验收对照**（P-2/L5/L6）：每个任务完成后对照验收清单逐项打钩
4. **避免多余抽象**（L2）：编辑态 CSS 放 `index.css`
5. **范式分离**（L3）：展示态组件保持 demo 结构，编辑态组件整块替换
6. **委派规则**：核心逻辑 Opus 直接写；重复性组件可委派 fast 子 Agent

### 新会话启动指令

每个新会话仅需说：**"开始当前任务"**。

---

## 流程改进

| ID | 名称 | 状态 | 说明 |
|---|---|---|---|
| P-1 | Demo 先行开发流程 | **执行中** | V1.0 路线图已采纳 |
| P-2 | 执行者验收闭环 | **已落地** | session-governor 执行闸门第 4 条"基准对照" |
| P-3 | ✅ Demo 行为规格 | 完成 | `evidence/demo-05-behavior-spec.md` |
| P-4 | 有意差异清单 | 维护中 | 当前 4 条 |
| P-5 | ✅ 对齐清单 | 完成 | `evidence/demo-05-alignment-checklist.md` |
| P-6 | 多模型交叉 Review | 待讨论 | |
| P-7 | 分批自动串行执行 | 待讨论 | |

---

## 已完成（全部历史）

| ID | 名称 | 完成日期 | task-log |
|---|---|---|---|
| V1.1-SCHEMA-EDIT | schema.json 可编辑 | 2026-04-10 | `evidence/task-logs/2026-04-10-v1.1-schema-edit.md` |
| V1.1-DATA | 测试数据全量同步 + skill-loader glob | 2026-04-09 | `evidence/task-logs/2026-04-09-v1.1-data.md` |
| V1.1-UNIFIED | Markdown 正文统一 B1-B5 | 2026-04-09 | `evidence/task-logs/2026-04-09-v1.1-unified.md` |
| V1-UX-FIX | V1-UX 用户反馈修正 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-ux-fix.md` |
| V1-UX | 发布前 UX 优化 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-ux-pre-release.md` |
| V1-5 | 代码分割 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-5-code-splitting.md` |
| V1-4 | 保存流程闭环 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-4-save-flow.md` |
| V1-LAYOUT | 布局间距全面优化 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-layout-optimization.md` |
| V1-BUG | Bug 修复批次 | 2026-04-08 | — |
| F2+F3 | 区块级编辑 + UI 对齐 | 2026-04-07 | `evidence/task-logs/2026-04-07-f2f3-block-editing.md` |
| V1-1 | 文档正文展开 | 2026-04-07 | `evidence/task-logs/2026-04-07-v1-1-doc-expand.md` |
| V1-2 | 技能 CRUD 入口 | 2026-04-07 | `evidence/task-logs/2026-04-07-v1-2-skill-crud.md` |
| V1-3 | 其他文件类型适配 | 2026-04-07 | `evidence/task-logs/2026-04-07-v1-3-extra-files.md` |
| Batch 1-5 | Demo 05 对齐修复 | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b*.md` |
| P-3/P-5 | 复盘 + 行为规格 + 对齐清单 | 2026-04-07 | `evidence/task-logs/2026-04-07-retrospective-and-behavior-spec.md` |
| D1-D5 | Demo 交互方案验证 + 落地 | 2026-04-05~06 | `evidence/task-logs/2026-04-05-demo-optimization.md` |
| T0/T1 | Skill 结构调研 + Frontmatter 编辑器 | 2026-04-05~06 | `evidence/task-logs/2026-04-05-skill-structure-research.md` |
| Phase 1-4 | 基础骨架 → 桌面化 | 2026-04-03 | `evidence/task-logs/2026-04-03-phase*.md` |
