# SkillForge 项目发展历程

> 本文件是项目完整历史记录，不自动加载。需要了解历史时按需读取。
> 最后更新：2026-04-10

---

## Phase 1：基础骨架（2026-04-03）

- 1.1 技术选型 + 项目初始化（React 19 + TypeScript 5.9 + Vite 8 + Tailwind v4 + shadcn/ui v4）
- 1.2 SKILL.md 解析器（YAML frontmatter + Markdown body）
- 1.3 基础 UI 框架
- 1.4 Skill 详情页
- 1.5 配置编辑器 MVP（sources.json）

## Phase 2：核心功能完善（2026-04-03）

- 2.1 Frontmatter 编辑器 + SKILL.md 实时预览
- 2.2 Topics.json 编辑器
- 2.3 配置导出/下载
- 2.4 Skill 验证器
- 2.5 UI 完善（暗色模式、搜索过滤）

## Phase 3：扩展数据 + 完善度（2026-04-03）

- 3.1 新增 5 个真实 Skill（共 8 个）
- 3.2 JSON Schema 查看器
- 3.3 Error boundary + Empty state
- 3.4 README + 生产构建验证

## Phase 4：布局重构 + 桌面化 + 创建向导（2026-04-03）

- 4.1 三栏布局基础（react-resizable-panels）
- 4.2 两级导航树（Skill 列表 + 文件树 + 节点描述）
- 4.3 上下文编辑器（根据选中节点动态切换）
- 4.4 检查器面板（验证/预览/关联/导出）
- 4.5 统一编辑状态（WorkspaceContext + useReducer）
- 4.6 Tauri v2 桌面封装（fs/dialog 插件）
- 4.7 本地 Skill 加载（读取 ~/.openclaw/ + 保存编辑）
- 4.8 Skill 创建向导（5 步 + 4 模板 + 导出/本地创建）

---

## Harness 机制优化（2026-04-03）

- 用 `backlog.md` 取代 `active-task.md`，简化任务管理
- 强化 `research-driven-dev.mdc`（豁免条件 + 增量功能必须调研）
- 强化 `session-governor.mdc`（收尾清单 4 项 + task-log 必须含调研记录）
- `references.md` 要求记录对比决策过程

## Demo 交互方案验证（2026-04-04 ~ 04-05）

**前序对话产出**（04-04）：
- `01-editor-preview-mapping.html` — 编辑器↔预览颜色编码 + hover 区域联动
- `02-three-approaches.html` — 三种关系可视化方案对比（架构总览图、交叉引用、探索模式）
- `03-fusion.html` — 融合方案 v2：四层递进交互 + 弱化关系指示器 + 字段级联动

**本次对话产出**（04-05）：
- `04-panel-alignment.html` — 面板对齐方案（SVG 桥线连接器 + 分段线性映射滚动同步 + 桥区列头设置浮窗 + 底部上下文栏）

## T0 Skill 结构调研（2026-04-05）

- 分析了 OpenClaw 服务器 18 个真实 Skill 的目录结构
- 核心发现：55% 是简单结构（L1+L2），只有 6%（tech-news-digest）使用 JSON Schema
- 输出：`project-harness/evidence/skill-structure-analysis.md`

## T1 Frontmatter 结构化编辑器（2026-04-06）

- 安装 zod@4.3.6 + react-hook-form@7.72.1 + @hookform/resolvers@5.2.2
- 创建 Zod frontmatter schema + 8 个新文件（TagInput + FrontmatterForm + 5 个分组子组件 + UnknownFieldsSection）
- i18n 中英文支持（i18next@26.0.3 + react-i18next@17.0.2）

## D2 Demo 方案落地到主应用（2026-04-06）

- 创建 `usePanelSync` hook（锚点缓存 + 分段线性映射 + Alt 独立滚动）
- BridgeConnector SVG 覆盖层组件（梯形连接 + hover 高亮 + tooltip）
- ContextBar 底部上下文栏
- editor-panel / inspector-panel 添加 `data-bridge-section` 区块标记

## D3 可视化面板对齐 Demo（2026-04-06）

- bridge-sections：从 3 区块扩展到 7 区块（basic/meta/env/tools/files/exec/doc）
- editor-panel：7 段区块 + BridgeSectionBlock 统一包装（彩色左边框 + 圆点 + 折叠/展开）
- inspector-panel：重构为纯源码预览面板，7 段拆分 + YAML 语法高亮

## D4 05-complete 对齐（2026-04-06）

**Batch 1 — 关系可视化**：
- 新增 bridge-relations.ts（关系类型/关系表/计数工具）
- 实体打标 data-eid + 关系计数指示器 + 点击委托

**Batch A — 字段映射闭环**：
- editor/inspector 双侧 data-field 统一命名
- 高亮支持 fa/fm + eid-selected/eid-related/eid-dimmed 同时生效

**Batch B — 关系探索闭环**：
- Esc 清除关系态
- 新增 relation-hover.tsx（关系气泡 + 延迟提示）

**Batch C — 架构条层级筛选**：
- bridge-sections 新增 layer 归属
- architecture-bar.tsx 顶部逻辑层导航条
- 区块/桥线根据层级执行 dim

**方案 C 面板重写**：
- BasicInfoDisplay 组件（Demo 风格字段行）
- CSS 类：.ecard/.fr/.fl/.fv
- 实体规则全面动态化（buildBridgeRelations 启发式关系生成器）

## D5 Demo 全页面视觉对齐（2026-04-06）

- 4 批次：B1 CSS-only 安全修复 → B2 Editor 组件结构 → B3 Inspector + 外围 → B4 精修
- 后续补修：Inspector basic 段间距、字段级整段映射补齐

## 执行复盘 + Demo 行为规格产出（2026-04-07）

- 识别 3 类根因：基准漂移、验收粒度不足、范式冲突
- 8 轮 Q&A 澄清关键决策（React 保留、从 demo 出发、两层文档支撑、纯暗色主题、3 条有意差异）
- 产出 `demo-05-behavior-spec.md`（15 章）

## 对齐清单产出 + Review 压实（2026-04-07）

- 产出 `demo-05-alignment-checklist.md`
- 最终分类：A 类 16 项 / B 类 1 项 / C 类 12 项 / D 类 6 项 / P 类 1 项 / 已对齐 103 项

## Batch 1-5 对齐修复（2026-04-07）

- Batch 1：主题系统对齐（oklch → demo zinc hex，冻结 light 模式）
- Batch 2：区块交互对齐（标题行点击拆分、折叠动画、hover 高亮）
- Batch 3：桥线+气泡对齐（桥线点击跳转、SVG circle dot、气泡位置/延迟）
- Batch 4：B 类决策执行（exec 字段前缀修正）
- Batch 5：运行时确认+产品决策（C 类 6 项验证、P1 进度条颜色决策）
- **对齐清单全部完成，Demo 对齐阶段正式收尾**

## P2 Demo 06-inline-edit（2026-04-07）

- 基于 05-complete 新增区块级编辑态交互 Demo
- 5 个可编辑区块 + 3 个只读区块 + 表单控件体系
- 后续 UI 优化：编辑按钮文字化、标题行控件上移、单行布局、Toggle 缩小

## 前端布局优化（2026-04-07）

- App.tsx 嵌套面板重构：桥线区缩窄（GUTTER 25→6）
- 字段高亮集中化：移除各组件 fieldVisualClass，改由 usePanelSync DOM 事件委托
- 新增 hoveredField 追踪 + .thin-scroll 滚动条样式

## F2+F3 区块级编辑 + UI 对齐（2026-04-07）

- bridge-sections 新增 trigger 区块（总 7→8）
- 从 06-inline-edit Demo 移植全部编辑态 CSS 类
- BridgeSectionBlock 重构：新增 editable/editing/onEdit/onCancel/onDone props
- 5 个可编辑区块（basic/trigger/meta/env/files）+ 3 个只读区块（tools/exec/doc）
- TriggerDisplay + BasicInfoDisplay 增强 + InlineTagInput + InlineToggle
- inspector-panel：splitPreviewInto8 + trigger 预览

## V1-1 文档正文展开（2026-04-07）

- editor-panel SectionsTree 重写：按章节展开/折叠

## V1-2 技能 CRUD 入口（2026-04-07）

- ADD_SKILL / REMOVE_SKILL action
- DropdownMenu 3 入口：创建/导入/粘贴
- 删除确认 AlertDialog

## V1-3 其他文件类型适配（2026-04-07）

- ExtraFile 类型 + extra-file 路由分支
- 4 种编辑器：JsonFormEditor、JsonViewer、MarkdownFileEditor、CodeViewer
- 安装 sugar-high@1.1.0
- 优化轮：FileSection 通用容器、Markdown 按 ## 分段编辑

## MD-ENGINE Markdown 统一解析引擎（2026-04-08）

- 选定 remark-parse（AST 双向、树形结构、生态丰富）
- 安装 unified@11 + remark-parse@11 + remark-stringify@11 + remark-frontmatter@5 + remark-gfm@4
- 新增 content-fragment.ts + markdown-engine.ts + fragment-renderer.tsx

## UX-EXPAND 全部展开/收起 + 折叠联动（2026-04-08）

- 编辑/预览面板标题栏新增展开/收起按钮
- 桥线区"面板联动"浮窗新增"折叠联动"开关

## BRIDGE-EXTRA extra-file 桥线联动补齐（2026-04-08）

- bridge-connector 从遍历硬编码改为扫描 DOM
- ExtraFileSourcePreview 组件：Markdown 结构化预览 + 桥线联动

## V1-BUG 修复批次（2026-04-08）

| # | 问题 | 修复 |
|---|---|---|
| 5 | Trigger 展示/编辑不一致 | TriggerDisplay 渲染全部 9 个字段 |
| 9 | 环境变量输入框宽度定死 | `.et td .fi { width: 100% }` |
| 10 | 工具区块行高偏大 | `.tc` padding 缩减 |
| 14 | 底部状态栏遮挡 | ContextBar/RelationBar shrink-0 + 底部 padding |

## 布局间距全面优化（2026-04-08）

- 7 个选择器 padding/width/gap 值缩减（边距减少 20-26%）
- 行高一致化：`.fr` 和 `.ef-row` 添加 min-height: 24px
- JSON 编辑器/Markdown list/ENV 表格对齐修复

## V1-UX 发布前 UX 优化（2026-04-08）

| 批次 | 内容 |
|---|---|
| B1 | #18+#19 图标统一 + 区块分隔增强 |
| B2 | #4+ 根节点标题 + 概览面板风格对齐 |
| B3 | #22 代码文件样式对齐（FileSection → data-bridge-section + 中性色） |
| B4 | #1 架构条动态适配（空层不显示、非 skill-md 返回 null） |
| B5 | #8 i18n 补全（14 个组件，zh.json 91→330 行） |

#15（子区块标题编辑）和 #16（编辑后校验）推迟到 V1.1。

## V1-UX 用户反馈修正（2026-04-08）

- 图标大小修正（三档方案：S 12px / M 14px / L 20px）
- 区块分隔线增强（margin 4→8px，opacity 0.04→0.08）
- 标题逻辑简化（非概览页统一"可视化编辑"）
- 架构条始终显示 6 层，无数据层虚线轮廓

## V1-4 保存流程闭环（2026-04-08）

- 安装 sonner（toast 组件）
- SAVE_SKILL action + markSaved 方法
- extra files 保存 + dirty 圆点 + toast 通知

## V1-5 代码分割（2026-04-08）

- WorkspaceShell React.lazy + 测试数据 dynamic import + editor 子视图 lazy
- 首屏 JS：1,235 KB → 243 KB（-80%），总 chunk 3 → 22

---

## V1.1 阶段

### V1.1-UNIFIED B1-B5 Markdown 正文统一（2026-04-08 ~ 04-09）

- B1：types/skill.ts 新增 FrontmatterStatus + bodyDocument；skill-parser/use-workspace/skill-serializer 适配
- B2：doc/exec 区块从 SectionsTree 替换为 FragmentBlock（富渲染 + 逐段编辑）
- B3：预览改用 editState.markdownBody；保存链路使用 markdownBody
- B4：BridgeSectionBlock + FileSection 合并为公共 SectionBlock
- B5：四分类路由（valid/invalid/missing/doc-only）+ DocOnlySkillPanel + BrokenFmSkillPanel

### V1.1-DATA 测试数据全量同步（2026-04-09）

- rsync 从服务器同步 18 个 Skill 完整文件
- skill-loader.ts 改为 import.meta.glob 自动发现
- tauri-fs.ts 加载 extra files

### V1.1-SCHEMA-EDIT schema.json 可编辑（2026-04-10）

- 排查发现 schema.json 路由到只读 SchemaViewer
- 新增 SchemaRawEditor（SectionBlock + textarea + JSON.parse 校验）
- i18n 补齐 workspace.file.schema

---

## 技术栈

| 类别 | 选择 | 版本 |
|---|---|---|
| 前端框架 | React + TypeScript | React 19, TS 5.9 |
| UI 组件 | shadcn/ui | v4 |
| CSS | Tailwind CSS | v4 |
| 构建 | Vite | v8 |
| 分栏布局 | react-resizable-panels | v4.9 |
| 桌面封装 | Tauri | v2.10 |
| 状态管理 | React Context + useReducer | — |
| 表单管理 | react-hook-form + Zod | RHF 7.72, Zod 4.3 |
| 国际化 | i18next + react-i18next | i18next 26.0, react-i18next 17.0 |
| Markdown 解析 | unified + remark | unified 11, remark-parse 11 |
| 后端 | 无（Tauri fs 插件直接读写文件） | — |

## 项目结构

```
src/
├── components/
│   ├── ui/                     # shadcn/ui 组件
│   ├── layout/                 # 布局（Header）
│   ├── workspace-shell.tsx     # 主工作区壳层（React.lazy）
│   ├── workspace/              # 三栏布局面板
│   │   ├── navigator-panel.tsx # 左栏：两级导航树
│   │   ├── editor-panel.tsx    # 中栏：上下文编辑器
│   │   ├── inspector-panel.tsx # 右栏：检查器/预览
│   │   ├── bridge-connector.tsx # SVG 桥线连接器
│   │   ├── context-bar.tsx     # 底部上下文栏
│   │   ├── section-block.tsx   # 统一区块容器
│   │   └── fragment-renderer.tsx # 内容片段渲染组件
│   ├── config-editor/          # 配置编辑器
│   ├── skill-editor/           # Skill 编辑器
│   │   └── frontmatter-form/   # Frontmatter 结构化表单
│   └── skill-wizard/           # 创建向导
├── i18n/                       # 国际化
├── lib/                        # 工具库（解析器/序列化器/引擎）
├── hooks/                      # 自定义 hooks
├── types/                      # 类型定义
├── data/                       # 测试数据
├── App.tsx                     # 根组件
└── index.css

src-tauri/                      # Tauri 桌面端配置
```

## Demo 文件索引

```
public/demos/
├── 01-editor-preview-mapping.html   # 编辑器↔预览 颜色编码
├── 02-three-approaches.html         # 三种关系可视化方案对比
├── 03-fusion.html                   # 融合方案 v2
├── 04-panel-alignment.html          # 桥线 + 滚动同步
├── 05-complete.html                 # 完整交互 demo（展示态基准）
└── 06-inline-edit.html              # 区块编辑态 demo（编辑态基准）
```

## Git 提交历史

```
(2026-04-10) feat(v1.1): schema.json 可编辑 + V1.1-STYLE-UNIFY 任务注册
(2026-04-09) feat(v1.1): unified Skill markdown body, test data glob, Tauri extra files
(2026-04-08) feat: V1-UX 发布前优化 + 用户反馈修正
(2026-04-08) feat: V1-5 代码分割 — 首屏 JS 从 1235KB 降至 243KB（-80%）
(2026-04-08) fix: 布局间距全面优化
(2026-04-08) feat: V1-4 保存流程闭环
(2026-04-07) feat: F2+F3 区块级编辑 + UI 对齐
(2026-04-07) feat: Demo 05 对齐 + 字体/颜色统一（Batch 1-5）
(2026-04-07) docs: D2-D5 回顾 + 行为规格 + 对齐清单
(2026-04-06) feat: D2-D5 bridge 可视化对齐
(2026-04-06) feat: T1 Frontmatter 结构化编辑器 + i18n
(2026-04-05) feat: 05-complete demo + 清理早期 demo
(2026-04-04) feat: Demo 交互方案验证
(2026-04-03) feat: Phase 1-4 全部完成
```

## 子 Agent 委派经验

### 适合委派（fast 模型）

| 任务类型 | 成功率 | 备注 |
|---|---|---|
| 纯 UI 组件编写 | 高 | Navigator/Inspector panel 无需修改 |
| Shell 命令执行 | 高 | 复制文件、安装依赖等 |
| 独立功能模块 | 高 | 导出按钮、暗色模式、Schema 查看器、错误边界 |
| 创建向导（多步表单） | 高 | 还主动扩展了 tauri-fs.ts |
| 表单组件体系（多文件） | 高 | 8 个文件一次完成，规格详细时质量好 |
| i18n 批量替换 | 高 | 大文件（400+ 行）可能遗漏后半段 |

### 需注意的场景

| 任务类型 | 问题 | 对策 |
|---|---|---|
| shadcn/ui Card 组件 | v4 API 变化，子 Agent 用了不存在的 prop | 委派时提供准确的 API 签名 |
| shadcn/ui Form 上下文 | FormLabel 在 FormField 外使用会报错 | 不走 RHF 管理的字段用普通 Label |
| 涉及类型断言的编辑器 | sources/topics 类型转换容易出错 | 提供明确的类型定义和示例 |

### 不适合委派

- 架构变更（如三栏布局重构的整体设计）
- 新 API 对接（如 react-resizable-panels v4 的 API 适配）
- 复杂状态管理（如 WorkspaceContext + useReducer 的设计）
