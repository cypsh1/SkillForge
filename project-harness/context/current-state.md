---

## description: 会话交接页（最近完成、下一步、环境状态）

status: active
last_updated: 2026-04-07

# 当前状态

> **本文件是对话交接页，每次对话结束前必须更新。**

## 项目

SkillForge — OpenClaw Skill 可视化配置工具

## 当前阶段

**V1.0 路线图执行中，F2+F3 区块编辑已完成。**

当前任务：T8 — 文档正文展开（下一步）。

### V1.0 执行顺序

```
P2 Demo 06（✅ 完成）→ F2+F3 区块编辑（✅ 完成）→ T8 文档展开 → F4 CRUD → F5 多文件 → UX-2+3 保存 → T2 代码分割
```

### 关键决策（2026-04-07 规划会话）

1. **F1 主题切换推迟到 V1.1**：V1.0 保持纯暗色（与 demo 对齐），避免无基准的 light mode
2. **F2+F3 必须 Demo 先行**：基于复盘 L1/L4 教训，编码前先产出 06-inline-edit.html 验证编辑态交互
3. **每个任务预设验收标准**：写入 backlog，"完成"= 验收清单全部 ✅
4. **新增 trigger 区块**：在 basic 和 meta 之间，展示触发条件（之前表单中有但展示面板中无）
5. **新增 FilesSection 表单**：files.read[] + files.write[] 的编辑组件（之前只有展示无编辑）
6. **执行策略**：新会话执行具体任务，harness 三件套传递上下文

## 已完成

### Phase 1（基础骨架）

- 1.1 技术选型 + 项目初始化
- 1.2 SKILL.md 解析器
- 1.3 基础 UI 框架
- 1.4 Skill 详情页
- 1.5 配置编辑器 MVP (sources.json)

### Phase 2（核心功能完善）

- 2.1 Frontmatter 编辑器 + SKILL.md 实时预览
- 2.2 Topics.json 编辑器
- 2.3 配置导出/下载
- 2.4 Skill 验证器
- 2.5 UI 完善（暗色模式、搜索过滤）

### Phase 3（扩展数据 + 完善度）

- 3.1 新增 5 个真实 Skill（共 8 个）
- 3.2 JSON Schema 查看器
- 3.3 Error boundary + Empty state
- 3.4 README + 生产构建验证

### Phase 4（布局重构 + 桌面化 + 创建向导）

- 4.1 三栏布局基础（react-resizable-panels）
- 4.2 两级导航树（Skill 列表 + 文件树 + 节点描述）
- 4.3 上下文编辑器（根据选中节点动态切换）
- 4.4 检查器面板（验证/预览/关联/导出）
- 4.5 统一编辑状态（WorkspaceContext + useReducer）
- 4.6 Tauri v2 桌面封装（fs/dialog 插件）
- 4.7 本地 Skill 加载（读取 ~/.openclaw/ + 保存编辑）
- 4.8 Skill 创建向导（5 步 + 4 模板 + 导出/本地创建）

### Harness 机制优化（2026-04-03）

- 用 `backlog.md` 取代 `active-task.md`，简化任务管理
- 强化 `research-driven-dev.mdc`（豁免条件 + 增量功能必须调研）
- 强化 `session-governor.mdc`（收尾清单 4 项 + task-log 必须含调研记录）
- `references.md` 要求记录对比决策过程

### T0 Skill 结构调研（2026-04-05）

- 分析了 OpenClaw 服务器 18 个真实 Skill 的目录结构
- 调研了官方文档（docs.openclaw.ai）和 ClawHub 规范
- 输出完整分析报告：`project-harness/evidence/skill-structure-analysis.md`
- 核心发现：
  - 55% 的 Skill 是简单结构（L1+L2），核心就是 SKILL.md
  - 只有 6%（tech-news-digest）使用 JSON Schema 定义配置
  - SKILL.md frontmatter 是唯一的官方元数据来源
  - 建议 T1 优先做好 frontmatter 结构化编辑器，再扩展 config 编辑

### T1 Frontmatter 结构化编辑器（2026-04-06）

- Batch 1: 安装 [zod@4.3.6](mailto:zod@4.3.6) + [react-hook-form@7.72.1](mailto:react-hook-form@7.72.1) + @hookform/[resolvers@5.2.2](mailto:resolvers@5.2.2)
- Batch 1: 创建完整的 Zod frontmatter schema（覆盖所有已知字段 + metadata 别名处理）
- Batch 1: 类型对齐 — SkillFrontmatter 从 Zod 推导，零 breaking change
- Batch 2: 8 个新文件 — TagInput 组件 + FrontmatterForm 主包装 + 5 个分组子组件 + UnknownFieldsSection
- Batch 3: 集成到 editor-panel.tsx 和 skill-detail.tsx，替换两处旧编辑器
- Batch 5: 运行时验证通过，删除旧 frontmatter-editor.tsx
- Batch 4: i18n 中英文支持（[i18next@26.0.3](mailto:i18next@26.0.3) + [react-i18next@17.0.2](mailto:react-i18next@17.0.2)）
  - 新增 src/i18n/（初始化 + zh/en 两套 locale JSON）
  - 6 个表单组件 + Header + TagInput 全部 t() 化，零硬编码中文
  - Header 新增语言切换按钮，persist 到 localStorage

### D2 Demo 方案落地到主应用（2026-04-06）

- Batch 1: 创建 `usePanelSync` hook（锚点缓存 + 分段线性映射 + Alt 独立滚动 + 指针追踪）
- Batch 1: 定义桥线区块配置（`bridge-sections.ts`：frontmatter / tools / body）
- Batch 2: BridgeConnector SVG 覆盖层组件（梯形连接 + hover 高亮 + 虚线/实线 + tooltip）
- Batch 3: ContextBar 底部上下文栏（当前区块指示 + 双面板滚动百分比 + Alt 提示）
- Batch 4: editor-panel 添加 `data-bridge-section` 区块标记，替换 ScrollArea 为原生滚动
- Batch 4: inspector-panel SKILL.md 预览拆分为三段（frontmatter / tools / body），添加区块标记
- Batch 5: App.tsx 集成 PanelSyncContext + BridgeConnector + ContextBar
- 验收：tsc ✅ build ✅ 浏览器验证 ✅

### D3 可视化面板对齐 Demo 方案（2026-04-06）

- bridge-sections.ts：从 3 区块（frontmatter/tools/body）扩展到 7 区块（basic/meta/env/tools/files/exec/doc）
- editor-panel.tsx：SkillMdPanel 7 段区块 + BridgeSectionBlock 统一包装（彩色左边框 + 圆点 + 折叠/展开）
- editor-panel.tsx：SkillOverviewPanel 吸收文件信息 + 关联文件（从 inspector 移入）
- inspector-panel.tsx：重构为纯源码预览面板，7 段拆分 + YAML 语法高亮（key 蓝 / value 绿 / bool 琥珀）
- App.tsx：右面板 collapsible 支持，概览视图时编程折叠
- index.css：区块视觉样式系统（7 色左边框 + 高亮 + 折叠动画 + 语法高亮 class）
- 清理 validation nodeType 死代码路径
- 验收：tsc ✅ build ✅ 浏览器验证 ✅

### D2 阶段 bugfix（2026-04-06）

- 修复：主任务「可视化编辑 / 源码预览」双面板默认宽度不等、刷新后右侧偏窄
- App.tsx：移除分栏布局持久化（避免历史窄布局污染刷新默认值）
- App.tsx：从 `skill-overview` 返回非概览节点时，右栏强制恢复到 `40%`，与中栏对齐
- 验收：`npx tsc -b --noEmit` ✅、`npm run build` ✅、浏览器刷新回归待人工确认

### D4 `05-complete` 对齐（关系可视化 Batch1，2026-04-06）

- 调研补齐：按规则检索 2026 参考（TanStack Devtools 双向通信、Hygraph Schema Graph、Google Code Search Cross References），并更新 `references.md`
- 新增 `bridge-relations.ts`：关系类型/关系表/计数工具（`→/↔/⊂`）
- `use-panel-sync.ts`：扩展关系共享状态（`selectedEid`、`selectedField`、`relatedEids`、选择/清空动作）
- `editor-panel.tsx`：实体打标 `data-eid` + 关系计数指示器（env/tools/files/exec）+ 点击委托
- `inspector-panel.tsx`：预览实体注入 `data-eid` + 关系态（selected/related/dimmed）+ 点击委托
- 新增 `relation-bar.tsx` 并集成到 `App.tsx`（关系路径栏：关系类型 + 目标 + 描述 + 清除）
- `index.css`：补充关系态样式与 relation bar 样式
- 验收：`npx tsc -b --noEmit` ✅、`npm run build` ✅

### D4 `05-complete` 对齐（Batch A 字段映射闭环，2026-04-06）

- editor-panel：点击同一元素时同时写入 `selectedField + selectedEid`（不再二选一）
- editor-panel：env/tools/files/exec 增加 `data-field` 统一命名并消费 `fa/fm`
- inspector-panel：实体注入规则补 `fieldKey`（与 editor `f-e-* / f-t-* / f-p-* / f-s-`* 对齐）
- inspector-panel：点击委托改为同时处理 `data-field` 与 `data-eid`
- inspector-panel：预览实体高亮支持 `fa/fm + eid-selected/eid-related/eid-dimmed` 同时生效
- index.css：新增 `.fa/.fm` 字段映射样式
- 验收：`npx tsc -b --noEmit` ✅、`npm run build` ✅

### D4 `05-complete` 对齐（Batch B 关系探索闭环，2026-04-06）

- use-panel-sync：新增 `Esc` 清除关系态（`selectedEid + selectedField`）
- editor-panel：关系计数入口增加 `data-ri`（作为关系气泡入口）
- 新增 `relation-hover.tsx`：实现关系气泡 `bub`（按关系类型分组）与延迟提示 `htip`
- relation-bar：新增 hover `flash`（目标实体闪烁反馈）
- App.tsx：集成 `RelationHover` overlay
- index.css：新增 `bub/htip/flash` 样式与动画
- 验收：`npx tsc -b --noEmit` ✅、`npm run build` ✅

### D4 `05-complete` 对齐（Batch C 架构条层级筛选，2026-04-06）

- bridge-sections：新增 layer 归属（identity/deps/caps/config/exec/ops）与层级映射表
- use-panel-sync：新增 `currentLayer`、`toggleLayer`、`clearLayer`、`isSectionDimmed`
- 新增 `architecture-bar.tsx`：顶部逻辑层导航条，支持点击切换/取消
- App.tsx：集成 ArchitectureBar（位于 Header 下、三栏布局上）
- editor-panel / inspector-panel：区块根据当前层级执行 dim（与 demo05 `sd` 语义对齐）
- bridge-connector：桥线根据层级执行 dim（fill/line opacity 降低）
- index.css：新增 `arch-`* 样式与 `.bridge-dim`
- 验收：`npx tsc -b --noEmit` ✅、`npm run build` ✅

### 方案 C 面板重写（2026-04-06）

**Batch 1**：

- 新增 `BasicInfoDisplay` 组件：Demo 风格字段行（名称/描述/版本/主页）
- `SkillMdPanel` basic 区块：FrontmatterForm 从默认展示改为按需展开（"编辑全部字段" 按钮）
- 新增 CSS 类：`.ecard/.fr/.fl/.fv`

**Batch 2 CSS/视觉对齐**：

- 编辑器容器 padding `p-4` → `p-3 pr-1.5`，预览容器 `space-y-1 p-1` → `p-3 pl-1.5`
- `SkillMdPanel` 的 `space-y-6` → 去掉（让 section 自身 margin 生效）

**Batch 3 data-field 补全**：

- 已在 D4 + Batch 1 中完成（editor 和 inspector 双侧均已有 data-field）

**Batch 4 实体规则全面动态化**：

- inspector-panel：`buildInspectorEntityRules(skill, fm)` 从 skill 数据动态生成实体注入规则
- bridge-relations.ts：完全重写 — 删除硬编码 `BRIDGE_RELATIONS`，改为动态 store
  - 新增 `buildBridgeRelations(skill, fm)`：启发式关系生成器
  - 从 env var description 关键词匹配脚本名
  - 从 required/optional bins 推断工具关系
  - 从 config files 推断包含关系
  - `extractScriptNames` 遍历脚本 parent section 下的所有子 section
- use-panel-sync.ts：接收 skill/fm 参数，当 skill 变化时重建关系 store
- App.tsx：将 selectedSkill/editFm 传入 usePanelSync
- relation-bar.tsx：从 `BRIDGE_RELATIONS` 常量改为 `getRelationStore()` 动态读取
- 验收：`npx tsc -b --noEmit` ✅、`npm run build` ✅、浏览器验证 17 个动态实体关系 ✅

### D5 Demo 05-complete 全页面视觉对齐（2026-04-06）

- 评估前次审计报告，发现 2 处事实性错误（gap 判断、section 评级偏悲观）+ 3 处遗漏（Inspector .pf 包装、布局架构差异、主题双模风险）
- 制定 7 条风险清单 + 4 批次执行策略，避免前次 22 区域一次全改的高风险
- **B1 CSS-only 安全修复**：arch-bar 6 种分层色 + padding 16px；context-bar 对齐 Demo；entity 高亮值（selected=蓝底白字、related=琥珀、dimmed=0.2）；`[data-field]` 基础过渡；flash 动画 2 次
- **B2 Editor 组件结构**：env 表列序修正（关系列→末尾）+ "必需/可选"；tools Card→紧凑 `.tc`；files list→单 `.ecard` monospace；doc 去字符数 + `.di/.dh` 11/9px；exec 扁平→ `.pi/.pi-indent` pipeline 树；meta list→ecard + 分段文本
- **B3 Inspector + 外围**：去掉 Inspector 滚动层 rounded-md/border/bg；relation-bar 从居中浮卡→全宽底部栏；relation indicator 从单行→ `.ri > .rp`* 竖向堆叠
- **B4 精修**：header 字号 12px/10px 对齐 Demo；bridge-tip 10px；`.pc` 预览容器；htip 居中定位 + pointer-events:none
- 验收：`npx tsc -b --noEmit` ✅、`npm run build` ✅、浏览器验证 ✅
- **设计决策**：不改 BRIDGE_GUTTER_EXTEND（25 是 react-resizable-panels 布局的正确值）；不替换主题 token 为 Demo hardcode hex
- **后续补修（同日）**：发现 Inspector `basic` 预览比 Demo 段间距偏大，根因是 `splitPreviewInto7()` 用 `join("\n\n")` 人为插入空行；已改为紧凑 `join("\n")` 并补回开头 `---`，浏览器复核 ✅
- **后续补修（同日）**：发现 Inspector 仅 `basic` 有 `.pf[data-field]` 包装，`env/tools/files/exec/doc` 缺失字段级整段映射；已补齐 wrapper，恢复 Demo 风格的左侧行/右侧段镜像高亮，`env` 浏览器复核 ✅

### 执行复盘 + Demo 行为规格产出（2026-04-07）

- 对 T1/D2~D5 全流程做深度复盘，识别 3 类根因：基准漂移、验收粒度不足、范式冲突
- 8 轮 Q&A 澄清关键决策：
  - React 框架保留（V3+ 产品演进需要），可视化面板忠实还原 demo DOM 结构
  - 开发方向："从 demo 出发往主应用接"，而非"从主应用出发往 demo 靠"
  - 两层文档支撑：Demo 行为规格（源头）→ 对齐清单（差距分析 + 验收打钩）
  - 主题决策：对齐 demo 纯暗色方案，不做 dark/light 双模式
  - 有意差异 3 条：布局机制 / 导航面板 / 动态数据
- 产出 `project-harness/evidence/demo-05-behavior-spec.md`（15 章，覆盖结构/样式/交互/数据属性映射/主题配色）
- 记录 4 项流程改进（P-1 ~ P-4）到 backlog

### 对齐清单产出 + Review 压实（2026-04-07）

- 产出 `project-harness/evidence/demo-05-alignment-checklist.md`
- 逐项对比 demo-05-behavior-spec 与主应用 10 个文件，A/B/C/D/R 五层分类
- 经第二轮独立 review 压实为最终版：
  - R 类并入 D4-D6（有意差异）
  - B2 归入 C 类
  - B1 改动范围纠正为 3 处
  - 左进度条颜色从 A 类移入 P 类（待产品决策）
  - A 类计数修正为 16 项
- 最终分类：A 类 16 项 / B 类 1 项 / C 类 12 项 / D 类 6 项 / P 类 1 项 / 已对齐 103 项

### Batch 1 主题系统对齐（2026-04-07）

- `.dark` 全部 oklch 色值替换为 demo zinc hex 体系
  - `--background: #09090b`, `--card: #18181b`, `--border: #27272a`
  - `--foreground: #e4e4e7`, `--muted-foreground: #71717a`
- 新增 `--dim: #52525b` CSS 变量 + Tailwind `text-dim` 工具类
  - 替换 `.arch-label`/`.arch-arrow`/`.dh`/`.pi-indent` 和 7 处 sh-txt
- 统一浮层底色 `#1c1c20`：`.bub`/`.htip`/bridge-pop/bridge-tip
- 冻结 light 模式：`index.html` 加 `class="dark"`，`use-theme.ts` 冻结，移除 header 主题切换
- A5-1 上下文栏区块名颜色对齐
- 验收：tsc ✅ build ✅ 浏览器 ✅ linter ✅

### Batch 2 区块交互对齐（2026-04-07）

- A2-1/A2-2：标题行点击拆分 — 箭头 `.ca` 触发折叠（stopPropagation），标题区 `.sl` 触发 `scrollBothToSection(sectionId)`（双面板跳转 + 高亮 1.2s）
  - `use-panel-sync.ts`：新增 `scrollBothToSection` API + `highlightTimerRef`
  - `editor-panel.tsx`：`BridgeSectionBlock` header 拆分
  - `inspector-panel.tsx`：`PreviewSectionBlock` header 拆分
- A2-3：折叠动画 — `.bridge-section-content` 增加 `transition: max-height .25s ease, opacity .2s`
- A2-4：hover 高亮 box-shadow — 7 个 `.bridge-highlight` 增加 `box-shadow: inset 0 0 0 1px rgba(255,255,255,.07)`
- 验收：tsc ✅ build ✅ linter ✅ 浏览器标题点击不触发折叠 ✅（动画效果和 1.2s 高亮消退待人工复核）

### Batch 3 桥线+气泡对齐（2026-04-07）

- A3-1：桥线点击 → 改用 `api.scrollBothToSection(b.id)`，复用 Batch 2 的双面板跳转 + 1.2s 高亮逻辑；删除独立 `scrollBothTo` 函数
- A3-2：SVG circle dot — 每个桥线区块增加 `<circle>` 元素（`r=3`，区块色 fill，默认 `opacity:0`，hover 时 `0.85`，带 `transition: opacity 0.15s`）
- A4-1：气泡弹出位置 — 从"指示器正下方 +6px"改为"实体右侧 +8px"，空间不足翻转到左侧 `-238px`，垂直安全边距 `[8, innerHeight-190]`
- A4-2：气泡消失延迟 — 新增 `bubTimerRef` + `clearBubTimer` + `scheduleBubHide`；indicator 离开 200ms、bubble 离开 150ms；鼠标进入 bubble/indicator 时清除定时器
- A4-3：气泡 max-width — 移除 Tailwind `max-w-[min(360px,...)]`，让 CSS `.bub { max-width: 240px }` 生效；`min-w` 对齐 demo `160px`
- 验收：tsc ✅ build ✅ linter ✅

### Batch 4 B 类决策执行（2026-04-07）

- B1：exec 脚本管道字段前缀 `f-s-*` → `f-x-*`（3 处：editor-panel 1 处 + inspector-panel 2 处）
- D4-D6：确认为有意差异（basic 增量编辑入口 / Inspector 文件操作 / Tauri 保存），保留不对齐
- 验收：tsc ✅ build ✅ 无 `f-s-` 残留 ✅

### Batch 5 运行时确认+产品决策（2026-04-07）

- C 类运行时确认：6 项全部在浏览器中验证
  - C4 scroll-behavior：JS 已用 `behavior:"smooth"`，功能等价 → 不修
  - C5 tooltip 偏移 2px → 不修
  - C6 tooltip 文案 → 已修复（"点击跳转" → "点击双面板跳转"）
  - C7/C8 hover 背景 → 功能等价，不修
  - C9 bub-i 字号 1px → 不修
- P1 产品决策：左进度条颜色 → 保留主应用区块跟随色（与上下文栏设计语言一致）
- Batch 1-4 回归验证：tsc ✅ build ✅ 浏览器验证 ✅
- **对齐清单 5 个 Batch 全部完成**，Demo 对齐阶段正式收尾

### 小修补（2026-04-07）

- 右侧进度条颜色：从固定 `bg-emerald-500` 改为跟随当前区块色（与左侧一致）
- 元数据区块默认展开：移除 `defaultCollapsed`，7 个区块统一默认展开
- 桥线 tooltip 文案："点击跳转" → "点击双面板跳转"（C6）

### P2 Demo 06-inline-edit（2026-04-07）

- 基于 `05-complete.html` 新增区块级编辑态交互 Demo
- 新增 **trigger 区块**（橙色，`--orange:#f97316`）：展示态（tag pill + bool badge + 命令字段）+ 编辑态（tag input + toggle + text input）
- 5 个可编辑区块（basic/trigger/meta/env/files）：各有独立编辑按钮、编辑态/展示态切换、"完成"/"取消"操作
- 3 个只读区块（tools/exec/doc）：`sec-ro` 类 + "🔒 只读" 标记
- 表单控件体系：`.fi` 输入框 / `.ft` 文本域 / `.ftg` toggle 开关 / `.fta` tag input / `.fb` 操作按钮
- "完成" 保存后左面板展示值 + 右面板 YAML 预览同步更新
- 8 个区块全部有桥线同步（SECTIONS 数组从 7 扩展到 8）
- 验收：浏览器验证 ✅（编辑/保存/取消流程正常、预览更新正确、只读标记可见）

### P2 Demo UI 优化（2026-04-07）

- **编辑按钮文字化**：图标 → "编辑" 文字按钮（`.eb` 10px dim text）
- **标题行控件上移**：点击"编辑"后标题行显示"编辑中 + 取消 + 完成"，移除底部 `.fac`
- **编辑中指示器**：线框 SVG pencil + dim 色文字，放在"取消"左侧
- **单行布局**：表单改为 `.ef-row`（label 右对齐 68px + 控件 flex:1），每行一个字段
- **Focus 效果对齐**：`border-color:#52525b; box-shadow:0 0 0 3px rgba(82,82,91,.5)` 与主应用 `--ring` 一致
- **Toggle 缩小**：28×15px（与 bridge-pop 一致），颜色改为中性灰（`rgba(82,82,91,.6)`）
- **编辑态去蓝化**：section 编辑态从蓝色调改为中性白边框（`rgba(255,255,255,.06)`）
- **完成按钮灰白高亮**：`background:rgba(255,255,255,.08)` + `color:var(--text)`
- 验收：浏览器验证 ✅（编辑/保存/取消、focus ring、标题行按钮、单行布局）

### 前端布局优化（2026-04-07）

- App.tsx 嵌套面板重构：ArchitectureBar/BridgeConnector/RelationBar/ContextBar 移入右栏内部，桥线区缩窄（GUTTER 25→6）
- 字段高亮集中化：移除各组件 `fieldVisualClass` 逻辑，改由 `usePanelSync` DOM 事件委托统一注入 fa/fm class
- 新增 `hoveredField` 追踪：hover 即高亮，点击锁定
- 视觉紧凑化：区块边框透明度 32%、padding/margin 缩减、预览行高 1.65→1.45
- 新增 `.thin-scroll` 滚动条样式
- 移除 bridge-connector circle dots
- navigator-panel：搜索图标 + 创建按钮图标 16→18px，节点字号 sm→xs，描述 10→11px
- 验收：tsc ✅ build ✅

### F2+F3 区块级编辑 + UI 对齐（2026-04-07）

- **bridge-sections.ts**：新增 `trigger` 区块（`{ id: "trigger", name: "触发条件", color: "#f97316", layer: "identity" }`），总区块从 7 扩展到 8
- **index.css**：从 `06-inline-edit.html` 移植全部编辑态 CSS 类
  - 展示辅助：`.bool-on/.bool-off/.tg-pill`
  - 编辑控件：`.eb/.eb-group/.editing-ind/.eb-cancel/.eb-done`
  - 表单系统：`.ef-row/.ef-lbl/.fi/.ft/.ftg*/.fta*/.ftag*/.fti`
  - 列表/表格：`.et-del/.et-add/.fl-item/.fl-add`
  - trigger 区块色：`[data-bridge-section="trigger"]`
- **BridgeSectionBlock 重构**：新增 `editable/editing/onEdit/onCancel/onDone` props
  - 编辑按钮在标题行右侧，编辑中显示 pencil + "编辑中" + "取消" + "完成"
  - `.editing` 类添加 box-shadow
- **5 个可编辑区块**（basic/trigger/meta/env/files）：各区块独立编辑状态
  - BasicEditForm：emoji + name + description(textarea) + version + author + homepage + source
  - TriggerEditForm：tag input(triggers/readWhen) + toggle(autoTrigger/userInvocable/disableModel) + text(cmdDispatch/cmdTool/cmdArgMode/allowedTools)
  - MetaEditForm：tag input(requiredBins/optionalBins/os) + text(primaryEnv)
  - EnvEditForm：动态表格（name/required toggle/description + 增删行）
  - FilesEditForm：读写路径列表（text input + 增删项）
- **3 个只读区块**（tools/exec/doc）：`readOnly` prop + "🔒 只读" 标记
- **TriggerDisplay 展示组件**：tag pill + bool badge + 命令字段（mono 字体）
- **BasicInfoDisplay 增强**：新增 emoji/author 行，移除旧"编辑全部字段"按钮
- **MetaOpenclawView 增强**：新增 OS 显示（tg-pill 标签），使用 `getOpenclawMetadata` helper
- **InlineTagInput + InlineToggle**：Demo 风格的轻量级表单控件（替代 shadcn/ui 重量级组件）
- **inspector-panel**：
  - `PreviewParts` 增加 `trigger` 字段
  - `splitPreviewInto8`：提取 trigger YAML 键（triggers/read_when/auto_trigger/command-*）
  - `buildSectionHtml` 增加 `trigger` case
  - `basicKeysExtended` 加入 emoji/author
  - `BASIC_FIELD_MAP` 加入 f-emoji/f-author
- **移除 FrontmatterForm import**：旧全字段编辑器不再在 SkillMdPanel 中使用
- 验收：tsc ✅ build ✅ linter ✅ 浏览器验证 ✅

### Demo 交互方案验证（2026-04-04 ~ 04-05）

**前序对话产出**（04-04）：

- `01-editor-preview-mapping.html` — 编辑器↔预览颜色编码 + hover 区域联动
- `02-three-approaches.html` — 三种关系可视化方案对比（架构总览图、交叉引用、探索模式）
- `03-fusion.html` — 融合方案 v2：四层递进交互 + 弱化关系指示器 + 字段级联动

**本次对话产出**（04-05）：

- `04-panel-alignment.html` — 面板对齐方案：
  - SVG 桥线连接器（梯形 + 实线/虚线表示高度差）
  - 分段线性映射滚动同步（区块边界帧级对齐）
  - 三项性能优化（锚点缓存 + SVG 持久化 + 单帧合并）
  - 桥区列头设置浮窗（链接图标 + hover 触发 + Alt 独立滚动）
  - 底部上下文栏（当前区块 + 双侧进度条）

## 技术栈


| 类别    | 选择                         | 版本                               |
| ----- | -------------------------- | -------------------------------- |
| 前端框架  | React + TypeScript         | React 19, TS 5.9                 |
| UI 组件 | shadcn/ui                  | v4                               |
| CSS   | Tailwind CSS               | v4                               |
| 构建    | Vite                       | v8                               |
| 分栏布局  | react-resizable-panels     | v4.9                             |
| 桌面封装  | Tauri                      | v2.10                            |
| 状态管理  | React Context + useReducer | —                                |
| 表单管理  | react-hook-form + Zod      | RHF 7.72, Zod 4.3                |
| 国际化   | i18next + react-i18next    | i18next 26.0, react-i18next 17.0 |
| 后端    | 无（Tauri fs 插件直接读写文件）       | —                                |


## 项目结构

```
src/
├── components/
│   ├── ui/                     # shadcn/ui 组件
│   │   └── tag-input.tsx       # 标签输入（Frontmatter 表单）
│   ├── layout/                 # 布局（Header）
│   ├── workspace/              # 三栏布局面板
│   │   ├── navigator-panel.tsx # 左栏：两级导航树
│   │   ├── editor-panel.tsx    # 中栏：上下文编辑器
│   │   ├── inspector-panel.tsx # 右栏：检查器/预览
│   │   ├── bridge-connector.tsx # SVG 桥线连接器
│   │   └── context-bar.tsx     # 底部上下文栏
│   ├── config-editor/          # 配置编辑器（sources, topics, schema, export）
│   ├── skill-editor/           # Skill 编辑器（frontmatter, validation）
│   │   ├── frontmatter-form/          # 新！Frontmatter 结构化表单
│   │   │   ├── index.tsx              # 主包装（useForm + FormProvider）
│   │   │   ├── basic-info-section.tsx # 基本信息
│   │   │   ├── trigger-section.tsx    # 触发条件
│   │   │   ├── runtime-section.tsx    # 运行时要求（metadata.openclaw）
│   │   │   ├── env-vars-section.tsx   # 环境变量动态数组
│   │   │   ├── install-section.tsx    # 安装配置
│   │   │   └── unknown-fields-section.tsx # 未知字段 K-V 编辑器
│   └── skill-wizard/           # 创建向导（5 步表单）
├── i18n/
│   ├── index.ts               # i18next 初始化
│   └── locales/
│       ├── zh.json            # 中文
│       └── en.json            # English
├── lib/
│   ├── bridge-sections.ts     # 桥线区块定义（ID/名称/颜色）
│   ├── schemas/
│   │   └── frontmatter-schema.ts  # Zod schema + metadata helpers
│   ├── skill-parser.ts         # SKILL.md 解析器
│   ├── skill-serializer.ts     # SKILL.md 序列化器
│   ├── skill-validator.ts      # Skill 验证器
│   ├── tauri-fs.ts             # Tauri 文件系统操作
│   ├── download.ts             # 文件下载工具
│   └── utils.ts                # shadcn/ui 工具
├── hooks/
│   ├── use-workspace.ts        # 统一状态管理（Context + Reducer）
│   ├── use-panel-sync.ts      # 面板滚动同步 + 桥线绘制协调
│   ├── use-theme.ts            # 暗色模式
│   └── use-mobile.ts           # 移动端检测
├── types/
│   ├── skill.ts                # Skill 类型定义
│   └── workspace.ts            # 工作区状态类型
├── data/
│   ├── skill-loader.ts         # 测试数据加载器
│   └── test-skills/            # 8 个真实 Skill 测试数据
├── App.tsx                     # 根组件（三栏布局 + Context）
├── main.tsx
└── index.css

src-tauri/                      # Tauri 桌面端配置
├── src/lib.rs                  # Rust 入口（fs/dialog/log 插件）
├── Cargo.toml                  # Rust 依赖
├── tauri.conf.json             # 窗口/权限配置
└── capabilities/default.json   # 文件系统权限（~/.openclaw/）
```

## Demo 文件索引

```
public/demos/
├── 01-editor-preview-mapping.html   # 编辑器↔预览 颜色编码 + hover 联动
├── 02-three-approaches.html         # 三种关系可视化方案对比
├── 03-fusion.html                   # 融合方案 v2（四层递进交互）
├── 04-panel-alignment.html          # 桥线 + 滚动同步 + 设置浮窗
├── 05-complete.html                 # ★ 完整交互 demo（展示态 UI 基准）
└── 06-inline-edit.html              # ★ 区块编辑态 demo（F2+F3 编辑态基准）
```

访问方式：`npm run dev` → `http://localhost:5173/demos/0N-xxx.html`

## Git 历史

```
568432b feat: 前端布局优化 — 嵌套面板 + 字段高亮集中化 + 视觉紧凑化
92c7b16 docs: harness 更新 — Demo 05 对齐全批次记录 + backlog 同步
62b37bf feat: Demo 05 对齐 + 字体/颜色统一（Batch 1-5）
5a9715c docs: D2-D5 回顾 + 行为规格 + 对齐清单 + harness 优化
5e2738f feat: D2-D5 bridge 可视化对齐 — 架构条/桥线/关系系统/上下文栏/滚动同步
cd6c024 feat: T1 Frontmatter 结构化编辑器 + i18n 中英文支持
cf91682 chore: 收尾 D1 + 准备 T0 Skill 结构调研任务
cc6c8a0 feat: 05-complete demo（关系可视化+面板对齐合并）+ 清理早期 demo
c3ff013 feat: Demo 交互方案验证 + Harness 机制优化
da8b882 docs: Phase 4 收尾 — 更新状态/日志/参考资料
82ccf67 feat: Skill 创建向导 + Dialog 集成
d41533b feat: 本地 Skill 加载 + Tauri 文件系统集成
aecd989 feat: Tauri v2 桌面封装初始化
3b48931 feat: 三栏布局重构 — 借鉴 DaVinci Resolve 面板设计
86d3e58 feat: Phase 3 完成 — README + 生产构建
1892c40 feat: Phase 3.1-3.3 — 更多 Skill + Schema 查看器 + 错误处理
fbbaf4d feat: Phase 2 完成 — 编辑器/验证/导出/暗色模式
4a0797e feat: 配置编辑器 MVP (Phase 1.5)
766a701 feat: SKILL.md 解析器 + Skill 详情页 (Phase 1.2 + 1.4)
19a3926 feat: 搭建项目骨架 + 基础 UI 框架 (Phase 1.1)
73ee389 feat: initial commit
```

## 当前环境状态

- 本地开发：`npm run dev` → [http://localhost:5173/](http://localhost:5173/)
- 生产构建：`npm run build` → dist/（908KB JS + 83KB CSS）
- Tauri 开发：`npm run tauri:dev`（需 Rust 工具链）
- Tauri 构建：`npm run tauri:build`
- Node.js v22.22.1, npm 10.9.4, Rust 1.94.1
- OpenClaw 服务器：`ssh openclaw` 可访问

## 子 Agent 委派经验

> 持续积累。每次使用子 Agent 后，根据结果更新本节。

### 适合委派（fast 模型）


| 任务类型        | 成功率 | 备注                                          |
| ----------- | --- | ------------------------------------------- |
| 纯 UI 组件编写   | 高   | Navigator/Inspector panel 无需修改              |
| Shell 命令执行  | 高   | 复制文件、安装依赖等                                  |
| README/文档生成 | 高   | —                                           |
| 独立功能模块      | 高   | 导出按钮、暗色模式、Schema 查看器、错误边界                   |
| 创建向导（多步表单）  | 高   | 还主动扩展了 tauri-fs.ts                          |
| 表单组件体系（多文件） | 高   | 8 个文件一次完成，规格详细时 fast 模型质量好                  |
| i18n 批量替换   | 高   | 10+ 文件的 t() 替换，提供完整映射表后一次通过                 |
| 数据采集/调研     | 高   | git clone + 文件分析、GitHub API 批量查询（注意 API 限速） |


### 需注意的场景


| 任务类型                 | 问题                                               | 对策                       |
| -------------------- | ------------------------------------------------ | ------------------------ |
| 使用 shadcn/ui Card 组件 | v4 API 变化，子 Agent 用了不存在的 `size` prop             | 委派时提供准确的 API 签名          |
| shadcn/ui Form 组件上下文 | FormLabel/FormDescription 在 FormField 外使用会报运行时错误 | 不走 RHF 管理的字段用普通 Label 替代 |
| 涉及类型断言的编辑器           | sources/topics 类型转换容易出错                          | 提供明确的类型定义和示例             |


### 不适合委派

- 架构变更（如三栏布局重构的整体设计）
- 新 API 对接（如 react-resizable-panels v4 的 API 适配）
- 复杂状态管理（如 WorkspaceContext + useReducer 的设计）

## 待办清单

详见 `project-harness/workflow/backlog.md`