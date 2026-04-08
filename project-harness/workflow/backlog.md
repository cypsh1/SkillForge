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

**V1-4 — 保存流程闭环**

V1-BUG 已完成。当前推进 V1-4。

## V1.0 路线图

> 目标：用户能完整走通"打开 Skill → 编辑 → 保存"的闭环，且体验可接受。
> 产品形态：**V1.0 以本地产品（Tauri 桌面应用）形式发布**，不含账户系统。

### V1.0 剩余任务

| 序号 | ID | 名称 | 状态 |
|---|---|---|---|
| 4 | **V1-4** | 保存流程闭环 | 待办 |
| 5 | **V1-5** | 代码分割 | 待办 |
| — | **V1-UX** | 发布前 UX 优化（#1 #4 #8） | 待办 |

### V1.0 已完成

| ID | 名称 | 完成日期 |
|---|---|---|
| F2+F3 | 区块级编辑 + UI 对齐 | 2026-04-07 |
| V1-1 | 文档正文展开 | 2026-04-07 |
| V1-2 | 技能 CRUD 入口 | 2026-04-07 |
| V1-3 | 其他文件类型适配 | 2026-04-07 |
| V1-BUG | Bug 修复批次（#5 #9 #10 #14） | 2026-04-08 |

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

| # | 问题 | 方案 | 验收 |
|---|---|---|---|
| 1 | 架构条需适配不同页面/Skill | 根据当前 Skill 实际数据动态生成层级，空层不显示（已有 `buildBridgeRelations` 基础）；非 SKILL.md 页面隐藏或简化架构条 | 切换不同 Skill 时架构条层级正确；概览/config 页面无异常 |
| 4 | 根节点详情页布局/UI 优化 | 优化 SkillOverviewPanel 布局和 UI 样式，保持与已有面板风格一致 | 视觉风格与可视化编辑面板一致 |
| 8 | i18n 不完整 | 排查 F2+F3 后新增组件（TriggerDisplay、编辑表单、FilesEditForm、V1-1~V1-3 新组件等），补齐 `t()` 调用 | 切换语言后所有功能标签切换正确 |
| 15 | 子区块标题编辑 + 预览同步 | 点击编辑时子区块标题也进入可编辑状态，修改后右侧源码预览同步更新 | 编辑态下标题可修改；保存后预览区标题同步变化 |
| 16 | SKILL.md 编辑后校验 | (a) SKILL.md frontmatter 编辑后触发 Zod 校验 + 提示；(b) 其他 MD 文件编辑后基础格式校验 | 编辑无效值时显示行内校验错误；保存前整体校验通过 |

---

## 各任务验收标准

### V1-4 保存流程闭环

**验收清单**：
- [ ] 编辑后自动出现琥珀色"已修改"徽章
- [ ] Tauri 端：保存按钮可见，点击写回文件系统
- [ ] 保存成功：toast 提示（2s）+ 徽章消失 + 按钮状态恢复
- [ ] 保存失败：红色 toast + 按钮恢复可点击
- [ ] Web 端：保存按钮不可见或降级为"导出"
- [ ] tsc ✅ build ✅

### V1-5 代码分割

**验收清单**：
- [ ] React.lazy + Suspense 拆分路由级组件
- [ ] 首屏 JS < 300KB
- [ ] 所有功能正常（切换 Skill、编辑、保存）
- [ ] tsc ✅ build ✅

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
