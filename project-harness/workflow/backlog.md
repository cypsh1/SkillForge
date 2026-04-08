---

## description: 任务待办清单（唯一的任务管理文件）

status: active
last_updated: 2026-04-08

# Backlog

> 所有待办、进行中、已完成的任务统一管理在此文件。
> AI 每次对话收尾时必须更新本文件。

## ID 命名规则

- **V1-N**：V1.0 活跃任务（数字 = 执行顺序）
- **V1-BUG**：V1.0 Bug 修复批次
- **V1-UX**：V1.0 发布前 UX 优化
- **历史 ID**（Phase/D/T/Batch/F/P 等）：已完成任务保持原 ID 不改
- **P-N**（带横杠）：流程改进讨论项（非执行任务）

## 当前任务

**无活跃任务。V1.0 路线图全部完成。**

下一步：发布准备（Tauri 构建、版本号、README 更新）或从 V1.1 待办中选择任务。

## V1.0 路线图

> 目标：用户能完整走通"打开 Skill → 编辑 → 保存"的闭环，且体验可接受。
> 产品形态：**V1.0 以本地产品（Tauri 桌面应用）形式发布**，不含账户系统。

### V1.0 剩余任务

| 序号 | ID | 名称 | 状态 |
|---|---|---|---|
| 4 | **V1-4** | 保存流程闭环 | ✅ 完成 |
| 5 | **V1-5** | 代码分割 | ✅ 完成 |
| — | **V1-UX** | 发布前 UX 优化（#18 #19 #4+ #22 #1 #8 完成；#15 #16 推迟 V1.1；#17 已在 V1-1 完成） | ✅ 完成 |

### V1.0 已完成

| ID | 名称 | 完成日期 |
|---|---|---|
| F2+F3 | 区块级编辑 + UI 对齐 | 2026-04-07 |
| V1-1 | 文档正文展开 | 2026-04-07 |
| V1-2 | 技能 CRUD 入口 | 2026-04-07 |
| V1-3 | 其他文件类型适配 | 2026-04-07 |
| V1-BUG | Bug 修复批次（#5 #9 #10 #14） | 2026-04-08 |
| V1-4 | 保存流程闭环 | 2026-04-08 |
| V1-5 | 代码分割 | 2026-04-08 |
| V1-LAYOUT | 布局间距全面优化 | 2026-04-08 |
| V1-UX | 发布前 UX 优化（#18 #19 #4+ #22 #1 #8） | 2026-04-08 |
| V1-UX-FIX | V1-UX 用户反馈修正（图标/分隔线/标题/架构条） | 2026-04-08 |

---

## V1-BUG 修复批次

来源：F2+F3 遗留 + 用户反馈

| # | 问题 | 说明 | 验收 | 状态 |
|---|---|---|---|---|
| 5 | Trigger 展示/编辑内容不一致 | 编辑态显示更多字段（高级字段），展示态隐藏了。展示态应显示所有有值的字段，空值字段可折叠 | 展示态与编辑态字段覆盖范围一致 | ✅ |
| 9 | 编辑控件不支持自适应布局 | 环境变量区块输入框宽度定死，窄屏溢出 | 输入框 `width:100%` + 容器约束，各宽度下不溢出 | ✅ |
| 10 | 工具区块行高偏大 | 视觉密度与其他区块不一致 | 行高与 env/files 等区块对齐 | ✅ |
| 14 | 底部状态栏遮挡编辑/预览区 | 状态栏（context-bar）覆盖在可视化编辑区和源码预览区底部，导致底部内容不可见 | 编辑区和预览区滚动到底时，内容完全可见，不被状态栏遮挡 | ✅ |

---

## V1-UX 发布前 UX 优化

V1-4/V1-5 完成后、发布前执行。

| # | 优先级 | 问题 | 方案 | 验收 |
|---|---|---|---|---|
| 18 | **P1** | 图标尺寸/位置统一优化 | 统一梳理 4 处图标问题：(a) 根节点校验 `ShieldCheck` h-5→size-4 对齐 severity 图标；(b) 桥线区面板联动 SVG 从 h-4→h-5 + 透明度 30%→50%；(c) 源码预览导出按钮 `Download` size-3→size-3.5 + 按钮 h-5→h-6；(d) 全局图标 size 审计，统一为 size-3.5/size-4 两档 | 所有图标视觉一致，可点击图标 ≥ 20px 热区 |
| 19 | **P1** | 区块边界分隔增强 | 为 `[data-bridge-section]` 添加轻量 `box-shadow: 0 1px 2px rgba(0,0,0,.12)` 或底部 `border-bottom: 1px solid rgba(255,255,255,.04)`；预览侧同步。纯 CSS 修改 | 编辑区和预览区的区块之间有清晰但不突兀的视觉分隔 |
| 4+ | **P2** | 根节点内容与标题优化 | (a) 标题从"可视化编辑"改为"技能概览"（`headerSegment` 已返回"概览"，但标题栏仍用通用标题）；(b) 合并原 #4：优化 SkillOverviewPanel 布局/样式；(c) 根节点内容深度重设计留 V1.1 | 根节点标题显示"技能概览"；概览卡片风格与编辑面板一致 |
| 22 | **P2** | 代码文件样式对齐 | 让 json/py/md 的展示/编辑态视觉接近 SKILL.md。**详细方案见下方验收标准** | 6 项改动点全部通过验收 |
| 1 | P3 | 架构条需适配不同页面/Skill | 根据当前 Skill 实际数据动态生成层级，空层不显示（已有 `buildBridgeRelations` 基础）；非 SKILL.md 页面隐藏或简化架构条 | 切换不同 Skill 时架构条层级正确；概览/config 页面无异常 |
| 8 | P3 | i18n 不完整 | 排查 F2+F3 后新增组件（TriggerDisplay、编辑表单、FilesEditForm、V1-1~V1-3 新组件等），补齐 `t()` 调用 | 切换语言后所有功能标签切换正确 |
| 15 | P3 | 子区块标题编辑 + 预览同步 | 点击编辑时子区块标题也进入可编辑状态，修改后右侧源码预览同步更新 | 编辑态下标题可修改；保存后预览区标题同步变化 |
| 16 | P3 | SKILL.md 编辑后校验 | (a) SKILL.md frontmatter 编辑后触发 Zod 校验 + 提示；(b) 其他 MD 文件编辑后基础格式校验 | 编辑无效值时显示行内校验错误；保存前整体校验通过 |
| 17 | P3 | 文档结构区块体验优化 | doc 区块各章节增加展开/收起切换按钮，方便快速浏览和定位 | 每个章节标题旁有展开/收起按钮；点击切换内容显隐；状态独立互不影响 |

---

## 各任务验收标准

### V1-UX #22 代码文件样式对齐

> 分析对话：[代码文件样式分析](f60dbb04-e291-41fd-b2a2-e9e5f2ced978)

**差异根因**：SKILL.md 使用 `BridgeSectionBlock` + `PreviewSectionBlock`（彩色左边框、圆点、bridge-badge、scrollBothToSection、`.pc` 包裹），而 extra-file 使用独立的 `FileSection` + `ExtraFileSourcePreview`（灰色边框、无圆点、tg-pill、无联动、裸 pre）。

**层 1：编辑面板 FileSection 视觉对齐**（extra-file-editors.tsx + index.css）

- [ ] **1a** 删除 `.file-section` 独立 CSS 规则，FileSection 组件改为输出与 BridgeSectionBlock 相同的 className 结构（不再输出 `file-section` class）
- [ ] **1b** 为 extra-file 区块分配中性主题色 `#64748b`（slate），FileSection 新增 `color` prop，渲染 `[data-bridge-section]` 时设置 `border-left-color`
- [ ] **1c** FileSection 标题行补齐 `<span className="bridge-section-dot" style={{ backgroundColor: color }} />`
- [ ] **1d** 徽章从 `tg-pill` 改为 `bridge-badge`
- [ ] **1e** FileSection header 的 `onClick` 加上 `api?.scrollBothToSection(sectionId)`

**层 2：预览面板对齐**（inspector-panel.tsx）

- [ ] **2a** ExtraFileSourcePreview 每个 section 补齐 `bridge-section-dot`（中性色）
- [ ] **2b** 每个 section 内容用 `.pc` 包裹（获得与 SKILL.md 预览一致的字号/行高/间距）
- [ ] **2c** section header 的 `onClick` 添加 `scrollBothToSection`（caret 单独 stopPropagation 切折叠）
- [ ] **2d** 徽章从 `tg-pill` 改为 `bridge-badge`

**涉及文件**：
- `src/components/workspace/extra-file-editors.tsx` — FileSection 组件
- `src/components/workspace/inspector-panel.tsx` — ExtraFileSourcePreview 组件
- `src/index.css` — 删除 `.file-section` 规则

**不在范围**（V1.1）：
- 实体注入（data-eid、关系指示器）
- 架构层暗化（dimmed）
- 字段级精确联动（左侧字段 hover 高亮右侧代码行）

**最终验收**：
- [ ] extra-file 编辑面板区块有中性色左边框 + 圆点 + bridge-badge，视觉上与 SKILL.md 区块风格统一
- [ ] extra-file 预览面板区块有圆点 + `.pc` 包裹 + bridge-badge，与 SKILL.md 预览风格统一
- [ ] 标题点击触发双面板跳转，caret 点击触发折叠
- [ ] tsc ✅ build ✅

### V1-4 保存流程闭环（已完成）

**验收清单**：
- [x] 编辑后自动出现琥珀色"已修改"徽章
- [x] Tauri 端：保存按钮可见，点击写回文件系统
- [x] 保存成功：toast 提示（2s）+ 徽章消失 + 按钮状态恢复
- [x] 保存失败：红色 toast + 按钮恢复可点击
- [x] Web 端：保存按钮不可见或降级为"导出"
- [x] tsc ✅ build ✅

### V1-5 代码分割（已完成）

**验收清单**：
- [x] React.lazy + Suspense 拆分路由级组件
- [x] 首屏 JS < 300KB
- [x] 所有功能正常（切换 Skill、编辑、保存）
- [x] tsc ✅ build ✅

---

## V1.1 待办

| ID | 名称 | 来源 | 说明 |
|---|---|---|---|
| V1.1-向导 | 创建向导整合 | #2 | 4 模板合并为单入口 + 可选"从模板预填"，减少用户困惑 |
| V1.1-子节点删除 | 子节点删除支持 | #3 | 目录子节点（config 文件等）支持删除 |
| V1.1-文档编辑 | 文档结构可编辑 | #6 | doc/exec 区块从只读变为可编辑（涉及 markdown body 解析→修改→序列化闭环） |
| V1.1-配色 | 配色方案优化 | #7 | 两个方向待选：优化彩色 / 深紫主题。需先在 demo 中验证，再实施 |
| V1.1-修改追踪 | 修改追踪增强 | #11 | 记录修改数量/位置/筛选（当前仅有 dirty 标记） |
| V1.1-在线导入 | ClawHub / GitHub 在线导入 | — | 从 ClawHub 搜索导入 + GitHub URL 导入 |
| V1.1-SSH | 远程 SSH Skill 加载 | — | 连接 OpenClaw 服务器读写 |
| V1.1-主题 | 深色/亮色主题切换 | — | 先产出 light mode demo 验证色值 |
| V1.1-Diff | 配置 Diff | — | 对比编辑前后变更 |
| V1.1-拖拽 | 拖拽排序 | — | sources/topics 列表拖拽重排 |
| V1.1-批量 | 批量操作 | — | 多 Skill 批量导出/验证 |
| V1.1-更新 | Tauri 自动更新 | — | 桌面应用自动更新 |
| V1.1-跨文件校验 | 跨文件联动校验 | #3b | 文件之间的依赖/引用关系校验（如 SKILL.md 中引用的脚本文件是否存在） |
| V1.1-代码联动 | 代码文件桥连/联动增强 | #23 | 为 extra-file 扩展 `usePanelSync` 字段映射逻辑，实现左侧字段 hover 高亮右侧对应代码行（需要为 extra-file 定义实体模型） |
| V1.1-统一解析 | 统一解析/展示/编辑架构 | #24 | 提取 `BridgeSectionBlock` 和 `FileSection` 的公共抽象层，统一 SKILL.md 和 extra-file 的解析→展示→编辑→预览→联动管线 |
| V1.1-标题编辑 | 子区块标题编辑+预览同步 | #15 | 点击编辑时子区块标题进入可编辑状态，修改后右侧源码预览同步更新 |
| V1.1-编辑校验 | SKILL.md 编辑后校验 | #16 | frontmatter 编辑后触发 Zod 校验 + 提示；其他 MD 文件编辑后基础格式校验 |

## V2.0 待办

| ID | 名称 | 来源 | 说明 |
|---|---|---|---|
| V2.0-账户 | 账户系统 + 用户数据存储 | #12 | 需要后端服务（API + DB + Auth）。方案选项：自建 / GitHub OAuth / 第三方Auth。V1.0 以本地产品形式发布，不含账户 |
| V2.0-Onboarding | 新用户引导 + 预设技能 | #13 | 依赖账户系统。提供预设技能模板、引导流程 |

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
| P-3 | ✅ Demo 行为规格 | 完成 | `project-harness/evidence/demo-05-behavior-spec.md` |
| P-4 | 有意差异清单 | 维护中 | 当前 4 条 |
| P-5 | ✅ 对齐清单 | 完成 | `project-harness/evidence/demo-05-alignment-checklist.md` |
| P-6 | 多模型交叉 Review | 待讨论 | |
| P-7 | 分批自动串行执行 | 待讨论 | |

---

## 已完成（全部历史）

| ID | 名称 | 完成日期 | task-log |
|---|---|---|---|
| V1-5 | 代码分割 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-5-code-splitting.md` |
| V1-4 | 保存流程闭环 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-4-save-flow.md` |
| V1-LAYOUT | 布局间距全面优化 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-layout-optimization.md` |
| Phase 1 | 技术选型 + 骨架 + SKILL.md 解析器 + 配置编辑器 MVP | 2026-04-03 | `evidence/task-logs/2026-04-03-phase1.md` |
| Phase 2 | Frontmatter 编辑器、Topics 编辑器、导出、验证器、暗色模式 | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md` |
| Phase 3 | 扩展 8 个 Skill、Schema 查看器、错误边界、README | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md` |
| Phase 4 | 三栏布局、Tauri 桌面封装、本地 Skill 加载、创建向导 | 2026-04-03 | `evidence/task-logs/2026-04-03-phase4.md` |
| D1 | Demo 交互方案验证（01-05 全系列） | 2026-04-05 | `evidence/task-logs/2026-04-05-demo-optimization.md` |
| T0 | Skill 内容结构调研 | 2026-04-05 | `evidence/task-logs/2026-04-05-skill-structure-research.md` |
| T1 | Frontmatter 结构化编辑器 + i18n | 2026-04-06 | `evidence/task-logs/2026-04-06-t1-frontmatter-form.md` |
| D2 | Demo 方案落地到主应用 | 2026-04-06 | `evidence/task-logs/2026-04-06-d2-bridge-landing.md` |
| D3 | 可视化面板对齐 Demo | 2026-04-06 | `evidence/task-logs/2026-04-06-d3-panel-alignment.md` |
| D2-BUG | 双面板默认等宽修复 | 2026-04-06 | `evidence/task-logs/2026-04-06-d2-panel-width-hotfix.md` |
| D4 | 05-complete 对齐 + 方案 C 面板重写 | 2026-04-06 | `evidence/task-logs/2026-04-06-d4-plan-c-panel-rewrite.md` |
| D5 | Demo 全页面视觉对齐（4 批次） | 2026-04-06 | `evidence/task-logs/2026-04-06-d5-visual-alignment.md` |
| D5-BUG/BUG2 | Inspector 间距 + 字段映射 hotfix | 2026-04-06 | — |
| P-3 | 执行复盘 + Demo 行为规格 | 2026-04-07 | `evidence/task-logs/2026-04-07-retrospective-and-behavior-spec.md` |
| P-5 | 对齐清单产出 | 2026-04-07 | `evidence/demo-05-alignment-checklist.md` |
| Batch 1-5 | Demo 05 对齐修复 | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b*.md` |
| UI-OPT | 前端布局优化 | 2026-04-07 | `evidence/task-logs/2026-04-07-frontend-layout-optimization.md` |
| P2 | 06-inline-edit.html Demo | 2026-04-07 | `evidence/task-logs/2026-04-07-p2-inline-edit-demo.md` |
| F2+F3 | 区块级编辑 + UI 对齐 | 2026-04-07 | `evidence/task-logs/2026-04-07-f2f3-block-editing.md` |
| V1-1 | 文档正文展开 | 2026-04-07 | `evidence/task-logs/2026-04-07-v1-1-doc-expand.md` |
| V1-2 | 技能 CRUD 入口 | 2026-04-07 | `evidence/task-logs/2026-04-07-v1-2-skill-crud.md` |
| V1-3 | 其他文件类型适配 | 2026-04-07 | `evidence/task-logs/2026-04-07-v1-3-extra-files.md` |
| V1-UX | 发布前 UX 优化 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-ux-pre-release.md` |
| V1-UX-FIX | V1-UX 用户反馈修正 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-ux-fix.md` |
