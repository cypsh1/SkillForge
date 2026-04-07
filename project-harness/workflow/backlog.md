---

## description: 任务待办清单（唯一的任务管理文件）

status: active
last_updated: 2026-04-07

# Backlog

> 所有待办、进行中、已完成的任务统一管理在此文件。
> AI 每次对话收尾时必须更新本文件。

## 当前任务

**F2+F3 — 区块级编辑 + UI 对齐**

视觉基准 `06-inline-edit.html` 已产出（P2 完成）。下一步将编辑态交互从 Demo 翻译到 React 组件。

详见下方"V1.0 路线图"。

## V1.0 路线图

> 目标：用户能完整走通"打开 Skill → 编辑 → 保存"的闭环，且体验可接受。
> 执行原则：Demo 先行（P-1）、验收对照基准（P-2）、翻译方向"从 demo 往主应用接"（复盘 L1）。

### 准备阶段

| ID | 名称 | 说明 | 产出物 | 状态 |
|---|---|---|---|---|
| P2 | 06-inline-edit Demo | 基于 05-complete 新增编辑态交互（basic/trigger/meta/env/files），验证 DOM 结构、CSS、input 样式、保存/取消流程 | `public/demos/06-inline-edit.html` | ✅ 完成 |
| P3 | F4 交互规格 | DropdownMenu 3 层入口 + 上传流程（Web vs Tauri）+ 删除确认 + 边界情况 | 写入本文件或独立 spec | 待办 |

### 第一梯队（V1.0 必须）

| 序号 | ID | 名称 | 视觉基准 | 验收标准 | 状态 |
|---|---|---|---|---|---|
| 1 | F2+F3 | 区块级编辑 + UI 对齐 | `06-inline-edit.html` | 见下方 | **当前任务** |
| 2 | T8 | 文档正文展开 | `05-complete.html` doc 区块 | 见下方 | 待办 |
| 3 | F4 | 技能 CRUD 入口 | 交互规格（P3） | 见下方 | 待办（依赖 P3） |
| 4 | F5 | 其他文件类型适配 | 已有 config 编辑器模式 | 见下方 | 待办 |
| 5 | UX-2+3 | 保存流程闭环 | 交互规格（内嵌） | 见下方 | 待办 |
| 6 | T2 | 代码分割 | 无（纯技术） | 见下方 | 待办 |

### 第二梯队（V1.1）

| ID | 名称 | 说明 |
|---|---|---|
| F1 | 深色/亮色主题切换 | V1.0 保持纯暗色（与 demo 对齐）。V1.1 先产出 light mode demo 验证色值，确认后再接入。 |
| T3 | 远程 SSH Skill 加载 | 直接连接 OpenClaw 服务器读取/写回 Skill |
| T4 | 配置 Diff | 对比编辑前后的变更 |
| T5 | 拖拽排序 | sources/topics 列表项拖拽重排 |
| T6 | 批量操作 | 多 Skill 批量导出/验证 |
| T7 | Tauri 自动更新 | 桌面应用自动检查和安装更新 |

---

## 各任务验收标准

### F2+F3 区块级编辑 + UI 对齐

**视觉基准**：`public/demos/06-inline-edit.html`（P2 产出后确认）

**区块→表单字段映射**：

| 区块 | 展示组件 | 可编辑 | frontmatter 字段 | 现有表单组件 | 需新建 |
|---|---|---|---|---|---|
| basic | BasicInfoDisplay | ✅ | name, description, version, emoji, author, homepage, source | BasicInfoSection | 否（拆为区块级子表单） |
| trigger（新增） | TriggerDisplay | ✅ | triggers, read_when, auto_trigger, user-invocable, disable-model-invocation, command-dispatch, command-tool, command-arg-mode, allowed-tools | TriggerSection | ✅ 展示组件需新建 |
| meta | MetaOpenclawView | ✅ | metadata.openclaw.* | RuntimeSection + InstallSection | 否 |
| env | env table | ✅ | env[] | EnvVarsSection | 否 |
| tools | ToolsBlock | ❌ 只读 | 从 markdown body 解析 | — | — |
| files | files card | ✅ | files.read[], files.write[] | — | ✅ FilesSection |
| exec | pipeline tree | ❌ 只读 | 从 markdown body 解析 | — | — |
| doc | SectionsTree | ❌ 只读 | 从 markdown body 解析 | — | — |

**验收清单**：
- [ ] basic/trigger/meta/env/files 五个区块各有独立编辑按钮
- [ ] 点击编辑仅切换当前区块为编辑态，其他区块不受影响
- [ ] 编辑态 DOM 结构和 CSS 与 `06-inline-edit.html` 逐项对齐
- [ ] 编辑态修改实时同步到 editState（react-hook-form）
- [ ] "完成"按钮收回编辑态，展示态显示更新后的值
- [ ] tools/exec/doc 无编辑按钮
- [ ] 新建 TriggerDisplay 展示组件 + trigger 区块集成到 SkillMdPanel
- [ ] 新建 FilesSection 表单组件（编辑 files.read[] 和 files.write[]）
- [ ] tsc ✅ build ✅ 浏览器验证 ✅

**编辑优化需求**（P2 Demo 优化中发现，F2+F3 实现时纳入）：

| 子项 | 说明 | 方案 |
|---|---|---|
| Undo/Redo | 编辑态内可撤销/重做操作（Ctrl+Z / Ctrl+Shift+Z） | `useReducer` + `immer` patches，标题行显示 `↶ N` 步数计数器 |
| 表单校验 | 字段级即时反馈（version 格式、URL 格式、必填项） | 复用 `frontmatter-schema.ts` 的 zod schema，错误内联显示 |
| 键盘快捷键 | Ctrl+S 保存当前区块、Escape 取消编辑、Tab 在字段间导航 | 区块级 `onKeyDown` 事件委托 |
| Dirty 状态追踪 | 编辑中离开区块/切换 Skill 时提示"未保存的更改" | 对比 initialValues vs currentValues，dirty 时阻止导航 |
| 草稿自动暂存 | 编辑中意外刷新不丢数据 | `localStorage` 按 `skillId:section` 键存草稿，进入编辑态时检测恢复 |

### T8 文档正文展开

**验收清单**：
- [ ] doc 区块每个章节标题可点击展开/折叠
- [ ] 展开后显示该章节的 markdown 正文（content 字段）
- [ ] 展开区域样式与 `.ecard` 容器对齐
- [ ] 多个章节可同时展开
- [ ] tsc ✅ build ✅

### F4 技能 CRUD 入口

**交互规格**（P3 编码前细化）：

Navigator `+` 按钮 → DropdownMenu：
1. **创建新技能** → 现有 SkillWizard dialog
2. **本地上传** → Web: `<input type="file" accept=".md" webkitdirectory>` / Tauri: `dialog.open()`
3. **外部接入** → V1.0 仅支持输入本地路径手动加载

Skill 条目 → ContextMenu 或 hover `...` 按钮：
- **删除** → 确认 Dialog → 从列表移除（不删文件）

**验收清单**：
- [ ] `+` 按钮改为 DropdownMenu，含 3 个入口
- [ ] 创建入口复用现有 SkillWizard
- [ ] 本地上传：选择文件/目录后解析 SKILL.md 并加入列表
- [ ] 外部接入：输入路径后加载（V1.0 简化版）
- [ ] 删除：确认弹窗 + 从列表移除
- [ ] 边界：非法文件提示、重名处理
- [ ] tsc ✅ build ✅

### F5 其他文件类型适配

**验收清单**：
- [ ] Navigator 树扩展：显示 `_meta.json`、`CHANGELOG.md`、`scripts/`、`references/` 等
- [ ] `_meta.json` → JSON 键值表单编辑
- [ ] 未识别的 `.json` → 通用 JSON 树形编辑器（只读或简单键值编辑）
- [ ] `.md` 文件 → textarea 编辑 + 预览
- [ ] `.py`/`.sh` → 代码查看器（只读 + 语法高亮）
- [ ] 不引入重型依赖（Monaco 等）
- [ ] tsc ✅ build ✅

### UX-2+3 保存流程闭环

**验收清单**：
- [ ] 编辑后自动出现琥珀色"已修改"徽章
- [ ] Tauri 端：保存按钮可见，点击写回文件系统
- [ ] 保存成功：toast 提示（2s）+ 徽章消失 + 按钮状态恢复
- [ ] 保存失败：红色 toast + 按钮恢复可点击
- [ ] Web 端：保存按钮不可见或降级为"导出"
- [ ] tsc ✅ build ✅

### T2 代码分割

**验收清单**：
- [ ] React.lazy + Suspense 拆分路由级组件
- [ ] 首屏 JS < 300KB
- [ ] 所有功能正常（切换 Skill、编辑、保存）
- [ ] tsc ✅ build ✅

---

## 执行策略（复盘防护）

基于 [复盘+行为规格](32b516bb) 和 [对齐清单+review](33216ea9) 的教训：

1. **Demo 先行**（P-1）：F2+F3 编码前必须完成 P2 demo 并经用户确认
2. **翻译方向**（L1）：从 demo HTML 结构出发写 JSX，不在旧组件上补丁式靠拢
3. **验收对照**（P-2/L5/L6）：每个任务完成后对照上方验收清单逐项打钩
4. **避免多余抽象**（L2）：编辑态 CSS 放 `index.css`，不用 Tailwind 重写 demo 样式
5. **范式分离**（L3）：展示态组件保持 demo 结构不动，编辑态组件新建并整块替换
6. **委派规则**：F2+F3 核心逻辑 Opus 直接写；重复性组件可委派 fast 子 Agent

### 新会话启动指令

每个新会话仅需说：**"开始当前任务"**。AI 会自动读取 harness 三件套。

### 会话规划

| 会话 | 任务 | 执行模式 |
|---|---|---|
| 新会话 1 | P2 Demo 06 | Opus 直接写，用户浏览器验证迭代 |
| 新会话 2 | F2+F3 区块编辑 | Opus 核心 + fast 重复组件 |
| 新会话 3 | T8 + F4 | T8 小改动 + F4 规格→组件 |
| 新会话 4 | F5 + UX-2+3 | Opus 核心 + fast 扩展 |
| 新会话 5 | T2 代码分割 | fast 可承担 |

---

## T1 实施建议（基于 T0 调研，存档参考）

**核心发现**：80% 的 Skill 编辑需求集中在 SKILL.md frontmatter。config/ 目录虽复杂但极稀少（6%）。

**分层策略**：
1. **第一层（P0）**：Frontmatter 结构化编辑器 — ✅ 已完成（T1）
2. **第二层（P1）**：Config 目录编辑器 — ✅ 已完成（sources/topics/schema）
3. **第三层（P2）**：文件浏览器 — F5 将实现

**调研报告**：`project-harness/evidence/skill-structure-analysis.md`

---

## 流程改进

| ID | 名称 | 状态 | 说明 |
|---|---|---|---|
| P-1 | Demo 先行开发流程 | **执行中** | V1.0 路线图已采纳：F2+F3 编码前先产出 06-inline-edit.html demo |
| P-2 | 执行者验收闭环 | **已落地** | session-governor 执行闸门第 4 条"基准对照"；backlog 每个任务带验收清单 |
| P-3 | ✅ Demo 行为规格 | 完成 | `project-harness/evidence/demo-05-behavior-spec.md` |
| P-4 | 有意差异清单 | 维护中 | 当前 4 条：布局机制、导航面板、动态数据、主题（V1.0 暗色，V1.1 讨论双模式） |
| P-5 | ✅ 对齐清单 | 完成 | `project-harness/evidence/demo-05-alignment-checklist.md` |
| P-6 | 多模型交叉 Review | 待讨论 | |
| P-7 | 分批自动串行执行 | 待讨论 | |

---

## 已完成

| ID | 名称 | 完成日期 | task-log |
|---|---|---|---|
| Phase 1 | 技术选型 + 骨架 + SKILL.md 解析器 + 配置编辑器 MVP | 2026-04-03 | `evidence/task-logs/2026-04-03-phase1.md` |
| Phase 2 | Frontmatter 编辑器、Topics 编辑器、导出、验证器、暗色模式 | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md` |
| Phase 3 | 扩展 8 个 Skill、Schema 查看器、错误边界、README | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md` |
| Phase 4 | 三栏布局、Tauri 桌面封装、本地 Skill 加载、创建向导 | 2026-04-03 | `evidence/task-logs/2026-04-03-phase4.md` |
| D1 | Demo 交互方案验证（01-05 全系列） | 2026-04-05 | `evidence/task-logs/2026-04-05-demo-optimization.md` |
| T0 | Skill 内容结构调研 | 2026-04-05 | `evidence/task-logs/2026-04-05-skill-structure-research.md` |
| T1 | Frontmatter 结构化编辑器 + i18n | 2026-04-06 | `evidence/task-logs/2026-04-06-t1-frontmatter-form.md` |
| D2 | Demo 方案落地到主应用（桥线+滚动同步+上下文栏） | 2026-04-06 | `evidence/task-logs/2026-04-06-d2-bridge-landing.md` |
| D3 | 可视化面板对齐 Demo（7 区块 + 源码预览重构） | 2026-04-06 | `evidence/task-logs/2026-04-06-d3-panel-alignment.md` |
| D2-BUG | D2 阶段 bugfix：双面板默认等宽修复 | 2026-04-06 | `evidence/task-logs/2026-04-06-d2-panel-width-hotfix.md` |
| D4 | 05-complete 对齐 + 方案 C 面板重写 + 关系动态化 | 2026-04-06 | `evidence/task-logs/2026-04-06-d4-plan-c-panel-rewrite.md` |
| D5 | Demo 全页面视觉对齐（4 批次） | 2026-04-06 | `evidence/task-logs/2026-04-06-d5-visual-alignment.md` |
| D5-BUG | Inspector basic 预览间距 hotfix | 2026-04-06 | `evidence/task-logs/2026-04-06-d5-inspector-basic-spacing-hotfix.md` |
| D5-BUG2 | Inspector 字段级镜像映射补齐 | 2026-04-06 | `evidence/task-logs/2026-04-06-d5-inspector-field-mapping-hotfix.md` |
| P-3 | 执行复盘 + Demo 行为规格产出 | 2026-04-07 | `evidence/task-logs/2026-04-07-retrospective-and-behavior-spec.md` |
| P-5 | 对齐清单产出 + 两轮 review 压实 | 2026-04-07 | `evidence/demo-05-alignment-checklist.md` |
| Batch 1 | 主题系统对齐（A1×6 + A5-1） | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b1-theme-alignment.md` |
| Batch 2 | 区块交互对齐（A2×4） | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b2-block-interaction.md` |
| Batch 3 | 桥线+气泡对齐（A3×2 + A4×3） | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b3-bridge-bubble.md` |
| Batch 4 | B 类决策执行（B1 + D4-D6 确认） | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b4-b-class-decision.md` |
| Batch 5 | 运行时确认+产品决策（C 类验证 + P1 决定） | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b5-runtime-verification.md` |
| UI-OPT | 前端布局优化（嵌套面板+字段高亮集中化+视觉紧凑化） | 2026-04-07 | `evidence/task-logs/2026-04-07-frontend-layout-optimization.md` |
| P2 | 06-inline-edit.html Demo（F2+F3 编辑态视觉基准） | 2026-04-07 | `evidence/task-logs/2026-04-07-p2-inline-edit-demo.md` |
