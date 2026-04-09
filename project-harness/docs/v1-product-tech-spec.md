# SkillForge V1.0 — 产品功能与技术方案文档

> **版本**: V1.0  
> **更新日期**: 2026-04-08  
> **用途**: 产品功能参考 + 技术架构参考 + AI Coding 上下文  
> **定位**: 后续所有优化（解析流程、统一编辑架构等）和版本演进的基准文档

---

## 目录

1. [产品概述](#1-产品概述)
2. [功能全景](#2-功能全景)
3. [功能模块详述](#3-功能模块详述)
  - 3.1 [技能导航与管理](#31-技能导航与管理)
  - 3.2 [SKILL.md 可视化编辑](#32-skillmd-可视化编辑)
  - 3.3 [源码预览与桥线联动](#33-源码预览与桥线联动)
  - 3.4 [其他文件编辑](#34-其他文件编辑)
  - 3.5 [架构层筛选与关系探索](#35-架构层筛选与关系探索)
  - 3.6 [配置编辑器](#36-配置编辑器)
  - 3.7 [技能验证](#37-技能验证)
  - 3.8 [保存与导出](#38-保存与导出)
  - 3.9 [创建向导](#39-创建向导)
4. [技术架构](#4-技术架构)
  - 4.1 [整体架构](#41-整体架构)
  - 4.2 [技术栈与依赖](#42-技术栈与依赖)
  - 4.3 [项目目录结构](#43-项目目录结构)
  - 4.4 [状态管理](#44-状态管理)
  - 4.5 [数据流全链路](#45-数据流全链路)
5. [核心子系统](#5-核心子系统)
  - 5.1 [SKILL.md 解析器](#51-skillmd-解析器)
  - 5.2 [Markdown 统一引擎](#52-markdown-统一引擎)
  - 5.3 [Frontmatter Schema](#53-frontmatter-schema)
  - 5.4 [面板同步系统](#54-面板同步系统)
  - 5.5 [桥线连接器](#55-桥线连接器)
  - 5.6 [关系推断引擎](#56-关系推断引擎)
  - 5.7 [序列化器](#57-序列化器)
6. [UI 组件架构](#6-ui-组件架构)
  - 6.1 [三栏布局](#61-三栏布局)
  - 6.2 [区块系统](#62-区块系统)
  - 6.3 [编辑态表单体系](#63-编辑态表单体系)
  - 6.4 [内容片段渲染](#64-内容片段渲染)
7. [构建与部署](#7-构建与部署)
  - 7.1 [代码分割策略](#71-代码分割策略)
  - 7.2 [Tauri 桌面封装](#72-tauri-桌面封装)
  - 7.3 [国际化](#73-国际化)
8. [已知限制与演进方向](#8-已知限制与演进方向)

---

## 1. 产品概述

### 定位

SkillForge 是 **OpenClaw Skill 可视化配置工具**，将 Skill 的配置从"手工编辑 YAML/JSON/Markdown"变为"可视化表单 + 实时预览"。

### 目标用户


| 优先级 | 用户                 | 核心需求                  |
| --- | ------------------ | --------------------- |
| P0  | OpenClaw Skill 开发者 | 降低开发调试成本，可视化配置        |
| P1  | OpenClaw 普通用户      | 降低使用门槛，图形化管理已安装 Skill |
| P2  | 企业 IT 管理员          | 批量配置、安全审计             |


### V1.0 核心价值

1. **可视化编辑**：SKILL.md 的 8 个语义区块以表单方式编辑，5 个可编辑 + 3 个只读
2. **双面板联动**：编辑面板与源码预览通过桥线实时同步，字段级 hover 高亮
3. **多文件支持**：除 SKILL.md 外，JSON 配置、Markdown 文档、Python/Shell 脚本均可查看或编辑
4. **桌面应用**：基于 Tauri 的桌面发行版，直接读写本地 `~/.openclaw/workspace/skills/`
5. **关系可视化**：环境变量、工具、脚本、配置文件之间的依赖关系自动推断并可交互探索

### 产品形态

- **主形态**：Tauri 桌面应用（macOS/Linux/Windows）
- **次形态**：纯 Web 版（内置 9 个测试 Skill，不可保存到文件系统，可导出下载）
- **主题**：纯暗色模式（V1.0 不支持 light mode）
- **语言**：中文/英文双语，通过 Header 切换，持久化到 localStorage

---

## 2. 功能全景

```
┌─────────────────────────────────────────────────────────────────┐
│                        SkillForge V1.0                          │
├───────────────┬───────────────────┬──────────────────┬──────────┤
│  技能导航管理   │  SKILL.md 可视化    │  源码预览 & 联动   │ 架构层   │
│               │     编辑            │                  │ 关系探索  │
│ • 技能列表     │ • 8 区块展示/编辑   │ • YAML 语法高亮   │          │
│ • 文件树       │ • 5 可编辑区块      │ • 桥线 SVG 连接   │ • 6 层   │
│ • 搜索过滤     │ • 3 只读区块        │ • 滚动同步        │   筛选   │
│ • 导入/创建    │ • inline 表单      │ • 字段级联动       │ • 实体   │
│ • 删除         │                    │ • 展开/折叠联动    │   关系   │
├───────────────┼───────────────────┼──────────────────┤   气泡   │
│  其他文件编辑   │  配置编辑器         │  保存与导出        │          │
│               │                    │                  │          │
│ • JSON 表单   │ • sources.json    │ • Tauri 文件写入  │          │
│ • Markdown    │ • topics.json     │ • 浏览器下载       │          │
│   分段编辑     │ • schema.json     │ • dirty 状态      │          │
│ • 代码只读     │   只读查看          │ • toast 通知      │          │
├───────────────┴───────────────────┴──────────────────┤          │
│  技能验证 │ 创建向导（4 模板 + 5 步）│ 国际化 zh/en       │          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 功能模块详述

### 3.1 技能导航与管理

#### 功能描述

左侧导航面板，提供技能列表浏览、搜索过滤、文件树展开、技能增删操作。

#### 交互细节

**技能列表**

- 展示所有已加载技能，每项显示：名称、版本 Badge、描述摘要
- 点击展开子树 + 自动选中该技能概览
- 已修改技能名称旁显示琥珀色圆点（dirty 指示）
- 搜索框过滤：匹配名称/描述/ID，仅过滤顶层 Skill，不过滤子节点

**文件树**（展开后）

- `SKILL.md`：固定第一项，点击进入可视化编辑视图
- `config/`：仅当 Skill 有配置文件时显示，子项为各 JSON 文件
- 额外文件：按目录分组（root / scripts/ / references/ / .clawhub/），图标按类型区分

**CRUD 操作**

- **创建**：`+` 按钮 → 下拉菜单 → "创建新技能"打开向导 Dialog
- **导入本地文件**：下拉菜单 → "导入 SKILL.md" → 隐藏 `<input type="file">` → FileReader 读取 → `parseSkillMd` 解析
- **粘贴导入**：下拉菜单 → "粘贴内容" → Dialog textarea → 解析并加入列表
- **删除**：Skill 行 hover 出现垃圾桶 → AlertDialog 确认 → 从列表移除
- **重名处理**：`deduplicateId()` 自动追加 `-2`, `-3`...

#### 技术实现


| 关键点      | 实现                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------- |
| 组件       | `NavigatorPanel`（唯一导出），内部 `SkillTreeBlock` / `TreeNode` / `ConfigSubtree` / `ExtraFilesSubtree` |
| 状态来源     | `useWorkspace()` → `state.skills`, `selection`, `editStates`                                    |
| 选中逻辑     | `select({ skillId, nodeType, filePath? })` → dispatch `SELECT` action                           |
| 展开状态     | 组件内部 `expandedIds: Set<string>`，非全局                                                             |
| 搜索       | 组件内部 `query` state，`filteredSkills` 用 `includes` 过滤                                             |
| dirty 标记 | 读取 `state.editStates[skillId]?.dirty`                                                           |


#### 涉及文件

- `src/components/workspace/navigator-panel.tsx`
- `src/types/workspace.ts`（`NavigatorSelection`, `NavigatorNodeType`）
- `src/hooks/use-workspace.ts`（`addSkill`, `removeSkill`）

---

### 3.2 SKILL.md 可视化编辑

#### 功能描述

将 SKILL.md 的 frontmatter 和 body 拆分为 **8 个语义区块**，以卡片形式展示和编辑。这是产品的核心功能。

#### 8 个区块


| 区块   | ID        | 颜色         | 逻辑层      | 可编辑  | 内容                                                             |
| ---- | --------- | ---------- | -------- | ---- | -------------------------------------------------------------- |
| 基本信息 | `basic`   | #3b82f6 蓝  | identity | ✅    | emoji, name, description, version, author, homepage, source    |
| 触发条件 | `trigger` | #f97316 橙  | identity | ✅    | triggers, read_when, auto_trigger, user-invocable, command-* 等 |
| 元数据  | `meta`    | #64748b 灰  | deps     | ✅    | metadata.openclaw: requiredBins, optionalBins, os, primaryEnv  |
| 环境变量 | `env`     | #f59e0b 琥珀 | deps     | ✅    | env[]: name, required, description                             |
| 工具   | `tools`   | #10b981 绿  | caps     | ❌ 只读 | 从 frontmatter.tools 和 body 的 ## Tools 提取                       |
| 文件权限 | `files`   | #8b5cf6 紫  | caps     | ✅    | files.read[], files.write[]                                    |
| 脚本管道 | `exec`    | #14b8a6 青  | exec     | ❌ 只读 | body 中 ## Scripts / ## Pipeline 等章节                            |
| 文档结构 | `doc`     | #14b8a6 青  | ops      | ❌ 只读 | body 中其他 ## 章节，可展开查看内容                                         |


#### 交互细节

**展示态**

- 每个区块有彩色左边框 + 圆点 + 标题 + 可选 badge
- 可独立折叠/展开（箭头），也可通过标题栏"全部展开/收起"按钮一键操作
- 点击标题行（非箭头区域）→ 双面板同步跳转到该区块 + 1.2s 高亮消退动画
- 只读区块显示 "🔒 只读" 标记

**编辑态**（5 个可编辑区块）

- 标题行右侧显示"编辑"按钮，点击进入编辑态
- 编辑中标题行变为：pencil 图标 + "编辑中" + "取消" + "完成"
- 编辑态有 box-shadow 视觉区分
- "取消"丢弃草稿回到展示态，"完成"合并到 frontmatter 并触发状态更新
- 每个区块独立编辑状态，互不干扰

**编辑表单详情**


| 区块      | 表单控件                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------- |
| basic   | emoji(input) + name(input) + description(textarea) + version/author/homepage/source(input)                  |
| trigger | InlineTagInput(triggers/readWhen) + InlineToggle(autoTrigger/userInvocable/disableModel) + input(command-*) |
| meta    | InlineTagInput(requiredBins/optionalBins/os) + input(primaryEnv)                                            |
| env     | 动态表格（name input + required toggle + description input + 增删行）                                                |
| files   | 读/写路径列表（text input + 增删项）                                                                                   |


#### 技术实现


| 关键点  | 实现                                                                                              |
| ---- | ----------------------------------------------------------------------------------------------- |
| 入口组件 | `SkillMdPanel`（editor-panel.tsx 内部组件）                                                           |
| 区块容器 | `BridgeSectionBlock` — 统一的展示/编辑/折叠容器                                                            |
| 编辑流程 | `startEdit`* 拷贝 draft → 表单编辑 draft → `save`* 合并回 frontmatter → `updateFrontmatter(skillId, fm)` |
| 展示组件 | `BasicInfoDisplay` / `TriggerDisplay` / `MetaOpenclawView` / 内联 env 表格 / 内联 files 列表            |
| 编辑组件 | `BasicEditForm` / `TriggerEditForm` / `MetaEditForm` / `EnvEditForm` / `FilesEditForm`          |
| 轻量控件 | `InlineTagInput`（标签输入）/ `InlineToggle`（开关），替代 shadcn/ui 重量级组件                                   |
| 区块定义 | `BRIDGE_SECTIONS`（bridge-sections.ts）：8 个区块的 id/name/color/layer                                |


#### 涉及文件

- `src/components/workspace/editor-panel.tsx`（~1200 行，核心组件）
- `src/lib/bridge-sections.ts`（区块定义）
- `src/lib/schemas/frontmatter-schema.ts`（Zod schema + metadata helpers）
- `src/types/skill.ts`（`SkillFrontmatter` 类型）

---

### 3.3 源码预览与桥线联动

#### 功能描述

右侧面板实时展示 SKILL.md 的源码，按相同的 8 区块拆分，与编辑面板通过 SVG 桥线连接并同步滚动。

#### 交互细节

**源码预览**

- SKILL.md 内容拆分为 8 段，每段独立 `PreviewSectionBlock`
- YAML 语法高亮：key 蓝色、value 绿色、bool 琥珀色
- 实体标注：环境变量名、工具名、脚本名等在预览中可点击，触发关系探索

**桥线连接（SVG）**

- 编辑面板和预览面板之间的缝隙绘制梯形 SVG 连接线
- 每个区块一根桥线，颜色跟随区块主题色
- 实线表示两侧高度对齐，虚线表示有高度差
- hover 桥线 → 两侧对应区块高亮
- 点击桥线 → 双面板同步跳转到该区块

**滚动同步**

- 默认启用，滚动一侧时另一侧同步跟随
- 基于**分段线性映射**算法：以 `[data-bridge-section]` 的 DOM 位置为锚点
- 按住 Alt 键临时独立滚动
- 鼠标指针所在面板为主动方，另一侧为跟随方

**字段级联动**

- hover 编辑面板的某个字段 → 预览面板对应代码行高亮（`.fa` + `.fm` CSS 类）
- 反向同理：hover 预览中的实体 → 编辑面板对应字段高亮
- 通过 `data-field` 属性和事件委托实现，不需要逐组件绑定

**展开/折叠联动**

- 编辑面板和预览面板各有"全部展开/收起"按钮
- 可开启"折叠联动"（桥线缝隙浮窗中的第三个开关），联动后一键控制两侧

**桥线缝隙浮窗**

- 缝隙中央的链接图标，hover 弹出设置浮窗
- 三个开关：滚动同步 / 桥线显示 / 折叠联动
- 显示 Alt+滚轮独立滚动的快捷键说明

#### 技术实现


| 关键点     | 实现                                                                                  |
| ------- | ----------------------------------------------------------------------------------- |
| 预览拆分    | `splitPreviewInto8(rawContent)` — 解析 frontmatter 的 YAML 块 + body 的 heading 分段       |
| HTML 生成 | `buildSectionHtml(sectionKey, raw, skill)` — 语法高亮 + 实体注入 + 字段包装                     |
| 实体注入    | `buildInspectorEntityRules(skill, fm)` — 动态生成正则匹配规则，为实体添加 `data-eid` / `data-field` |
| 桥线 SVG  | `BridgeConnector` — 扫描两侧 `[data-bridge-section]` DOM → 计算梯形几何 → `<path>` 渲染         |
| 滚动同步    | `usePanelSync` hook — `buildAnchors()` + `mapScroll()` 分段线性插值                       |
| 字段联动    | DOM 事件委托 + `fa/fm` class 注入（`usePanelSync` 内的 `useEffect`）                          |
| 上下文栏    | `ContextBar` — 当前区块名 + 双侧滚动进度百分比 + Alt 状态                                           |


#### 涉及文件

- `src/components/workspace/inspector-panel.tsx`（预览面板，~900 行）
- `src/components/workspace/bridge-connector.tsx`（SVG 桥线）
- `src/components/workspace/context-bar.tsx`（底部状态栏）
- `src/hooks/use-panel-sync.ts`（面板同步核心 hook）

---

### 3.4 其他文件编辑

#### 功能描述

除 SKILL.md 外的附加文件（`_meta.json`、`README.md`、`CHANGELOG.md`、Python 脚本等）提供查看或编辑功能。

#### 支持的文件类型


| 类型       | 编辑器                  | 能力                                                 |
| -------- | -------------------- | -------------------------------------------------- |
| JSON     | `JsonFileEditor`     | 展示态 key-value 行 / 编辑态表单输入                          |
| Markdown | `MarkdownFileEditor` | 按 heading 拆分 section，每 section 独立编辑（FragmentBlock） |
| Python   | `CodeFileViewer`     | sugar-high 语法高亮，只读                                 |
| Shell    | `CodeFileViewer`     | sugar-high 语法高亮，只读                                 |


#### 交互细节

- 附加文件使用 `FileSection` 容器（与 `BridgeSectionBlock` 视觉一致：中性灰色左边框 + 圆点 + bridge-badge）
- 标题点击同样触发双面板同步跳转
- Markdown 文件按 heading 拆分为多个 section，每个可独立展开/折叠、编辑/取消/完成
- 编辑态内使用 `FragmentBlock` 渲染各种内容块（段落 → textarea，列表 → 逐项 input，代码 → 只读）
- 预览面板的 `ExtraFileSourcePreview` 与编辑面板结构相同，共享 `data-bridge-section` 使桥线生效
- 全部展开/折叠联动同样对附加文件的 `FileSection` 生效

#### 技术实现


| 关键点  | 实现                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------- |
| 解析引擎 | `parseDocument()` — remark AST → `ParsedDocument`（preamble + sections[ContentBlock[]]）         |
| 片段渲染 | `FragmentBlock` — 按 block.type 分发渲染/编辑组件                                                       |
| 区块容器 | `FileSection` — 输出 `[data-bridge-section]` 参与桥线配对                                              |
| 预览侧  | `ExtraFileSourcePreview` — 对 Markdown 走 `parseDocument` 结构化预览，其他类型走 sugar-high 高亮              |
| 数据流  | 编辑 → `onChange(newContent)` → `updateExtraFile(skillId, path, content)` → editState.extraFiles |


#### 涉及文件

- `src/components/workspace/extra-file-editors.tsx`
- `src/components/workspace/fragment-renderer.tsx`
- `src/lib/markdown-engine.ts`
- `src/types/content-fragment.ts`

---

### 3.5 架构层筛选与关系探索

#### 功能描述

通过顶部架构条和实体关系系统，帮助用户理解 Skill 的逻辑结构和组件间依赖关系。

#### 架构层（6 层）


| 层 ID     | 名称  | 图标  | 包含区块           |
| -------- | --- | --- | -------------- |
| identity | 身份  | 🪪  | basic, trigger |
| deps     | 依赖  | 📦  | meta, env      |
| caps     | 能力  | ⚡   | tools, files   |
| config   | 配置  | ⚙️  | —              |
| exec     | 执行  | ▶️  | exec           |
| ops      | 运维  | 🔧  | doc            |


#### 交互细节

**架构条**（仅 `skill-md` 视图显示）

- 顶部水平排列 6 个层级 chip
- 有数据的层级实色填充，无数据层级虚线轮廓 + 低透明度
- 点击某层 → 非该层区块暗化（dimmed）+ 桥线暗化 + 自动滚动到该层首个区块
- 再次点击取消筛选

**关系指示器**（编辑面板侧）

- env/tools/files/exec 区块中的实体旁显示关系计数角标（`data-ri`）
- hover 角标 → 弹出关系气泡，按类型分组显示关联目标
- 点击气泡中的目标 → 选中该实体 → 预览面板高亮

**关系类型**

- `→` 引用：如环境变量引用脚本
- `↔` 替代：如 `OPENAI_API_KEY` 与 `DEEPSEEK_API_KEY` 互为 fallback
- `⊂` 包含：如 `config-defaults` 包含 `sources.json`

**关系栏**（底部）

- 选中实体后出现，显示所有关联关系
- hover 某关系目标 → 对应实体闪烁动画
- 点击可切换选中目标
- `✕ 清除` 或 Esc 退出关系探索

**延迟提示**

- hover 有关系的实体 400ms 后，出现 "点击查看关联关系" 提示
- 已有选中实体时不显示

#### 技术实现


| 关键点  | 实现                                                                                           |
| ---- | -------------------------------------------------------------------------------------------- |
| 架构条  | `ArchitectureBar` — `hasLayerContent()` 检查数据，`toggleLayer()` 切换                              |
| 关系推断 | `buildBridgeRelations(skill, fm)` — 启发式规则，详见 5.6 节                                           |
| 关系存储 | 模块级 `_store: Record<string, BridgeRelation[]>`，通过 `setRelationStore` / `getRelationStore` 访问 |
| 气泡   | `RelationHover` — 文档级事件委托，定位到 `[data-ri]` 元素弹出                                               |
| 关系栏  | `RelationBar` — 读取 `getRelations(selectedEid)` 展示                                            |
| 状态管理 | `usePanelSync` 中的 `selectedEid` / `selectedField` / `relatedEids` / `currentLayer`           |


#### 涉及文件

- `src/components/workspace/architecture-bar.tsx`
- `src/components/workspace/relation-hover.tsx`
- `src/components/workspace/relation-bar.tsx`
- `src/lib/bridge-relations.ts`
- `src/lib/bridge-sections.ts`（`BRIDGE_LAYERS`, `LAYER_SECTION_IDS`）

---

### 3.6 配置编辑器

#### 功能描述

对 Skill 的 `config/` 目录下 JSON 配置文件提供结构化编辑。目前仅 `tech-news-digest` 等少量 Skill 有配置文件。

#### 支持的配置类型


| 文件名            | 编辑器             | 功能                                                      |
| -------------- | --------------- | ------------------------------------------------------- |
| `sources.json` | `SourcesEditor` | 数据源列表编辑：name/enabled/priority/url/handle，顶部统计           |
| `topics.json`  | `TopicsEditor`  | 主题列表编辑：emoji/label/description/search.queries/display.* |
| `schema.json`  | `SchemaViewer`  | JSON Schema 只读查看                                        |
| 其他 `.json`     | —               | 显示"不支持表单编辑"提示                                           |


#### 交互细节

- 导航面板点击 `config/` 下文件 → 中栏切换为配置编辑器
- 左侧表单编辑，右侧实时 JSON 预览（`JsonPreview`）
- sources 每项为一个卡片，支持 Switch（enabled/priority）、Input、Badge 列表
- topics 每项为一个卡片，支持 queries 动态增删、display 设置

#### 技术实现


| 关键点 | 实现                                                                                                |
| --- | ------------------------------------------------------------------------------------------------- |
| 路由  | `ConfigFileEditor`（editor-panel.tsx 内部）→ `configEditorKind(path)` 判断文件名 → 类型守卫确认数据形态              |
| 状态  | `updateConfig(skillId, path, data)` → workspace reducer → `editStates[skillId].configFiles[path]` |
| 预览  | `JsonPreview` — `JSON.stringify(data, null, 2)` 在 `<pre>` 中展示                                     |


> **已知限制**：`ConfigEditor` 组件（`config-editor.tsx`）内部有独立的 `editedConfigs` 状态克隆，但在 workspace 三栏视图中已被 `ConfigFileEditor` 替代，后者直接通过 `updateConfig` 写入全局状态。旧 `ConfigEditor` 路径仅在 Phase 2 的独立页面中使用。

#### 涉及文件

- `src/components/config-editor/config-editor.tsx`
- `src/components/config-editor/sources-editor.tsx`
- `src/components/config-editor/topics-editor.tsx`
- `src/components/config-editor/json-preview.tsx`
- `src/components/config-editor/export-button.tsx`

---

### 3.7 技能验证

#### 功能描述

对已加载 Skill 进行自动化检查，报告配置问题。在技能概览页底部展示。

#### 检查规则


| 规则       | 级别      | 条件                                   |
| -------- | ------- | ------------------------------------ |
| 名称必填     | error   | name 为空或为 "unknown"                  |
| 名称格式     | error   | 不符合 kebab-case                       |
| 缺少描述     | warning | frontmatter.description 和 body 描述均为空 |
| 未设版本     | warning | version 为空                           |
| 环境变量名为空  | warning | env[i].name 为空                       |
| 环境变量说明为空 | warning | env[i].description 为空                |
| 未定义工具    | warning | tools 数组为空                           |
| 工具名为空    | warning | tools[i].name 为空                     |
| 环境变量多    | info    | env 数量 > 10                          |
| 含配置文件    | info    | hasConfig 或 configFiles 非空           |


#### 交互细节

- 概览页底部 `ValidationPanel`：绿色通过 / 按严重度（error 红/warning 黄/info 蓝）分类展示
- 每条 issue 显示 severity 图标 + 字段名 + 描述

#### 技术实现

- `validateSkill(skill: ParsedSkill)` → `ValidationResult`
- 概览面板中 `mergeSkillForValidation()` 合并当前编辑态数据后再校验
- `ValidationPanel` 为纯展示组件，Suspense lazy 加载

#### 涉及文件

- `src/lib/skill-validator.ts`
- `src/components/skill-editor/validation-panel.tsx`

---

### 3.8 保存与导出

#### 功能描述

编辑完成后将修改写回文件系统（Tauri）或下载为文件（Web）。

#### 交互细节

**Tauri 桌面端**

- 预览面板标题栏显示"保存"按钮（仅 dirty 状态可见）
- 点击保存 → 依次写入 SKILL.md + 配置文件 + 附加文件
- 成功 → `toast.success("已保存")` + dirty 清零 + 导航面板琥珀点消失
- 失败 → `toast.error()` + 按钮恢复可点击

**Web 浏览器端**

- 无保存按钮，改为"导出"
- SKILL.md：下载为 `.md` 文件
- 配置文件：`ExportButton` 下载为 `.json` 文件

#### 技术实现

**保存流程**

```
editState.frontmatter  ─→  serializeSkillMd(fm, markdownBody)  ─→  saveSkillFile("SKILL.md", content)
editState.configFiles   ─→  JSON.stringify                       ─→  saveSkillConfig(path, data)
editState.extraFiles    ─→  直接内容                              ─→  saveSkillFile(path, content)
```

**序列化**：`serializeSkillMd(fm, body)` — 将 frontmatter 对象转为 YAML（`yaml` 库 `stringify`），拼接 `---\n...\n---\n` + markdown body

**文件系统**：`tauri-fs.ts` — 动态 `import("@tauri-apps/plugin-fs")` → `writeTextFile(fullPath, content)`

**dirty 状态管理**

- 任何 `UPDATE_FRONTMATTER` / `UPDATE_CONFIG` / `UPDATE_EXTRA_FILE` action 自动 `dirty: true`
- `SAVE_SKILL` action：更新 `skills[]` 数组中对应 skill 的数据 + 删除 `editStates[skillId]`（dirty 归零）

#### 涉及文件

- `src/lib/skill-serializer.ts`
- `src/lib/tauri-fs.ts`
- `src/lib/download.ts`
- `src/components/workspace/inspector-panel.tsx`（`handleSaveAll`）
- `src/hooks/use-workspace.ts`（`SAVE_SKILL` action）

---

### 3.9 创建向导

#### 功能描述

5 步向导 + 4 个模板，引导用户创建新 Skill。

#### 步骤


| 步骤       | 内容                                                        |
| -------- | --------------------------------------------------------- |
| 0. 选择模板  | blank（空白）/ basic-tool（基础工具）/ configurable（可配置）/ clone（克隆） |
| 1. 基本信息  | name, description, version, author, homepage              |
| 2. 工具列表  | 动态增删工具（name + description）                                |
| 3. 环境变量  | 动态增删环境变量（name + required + description）                   |
| 4. 预览与导出 | 目录结构预览 + SKILL.md 源码预览 + "导出下载" / "本地创建"(Tauri)           |


#### 交互细节

- 步骤条可点击已到达过的步骤
- 模板选择后自动预填工具/环境变量示例
- 预览步展示生成的目录结构和 SKILL.md 源码
- Tauri 下"本地创建"按钮 → `createLocalSkillBundle()` → 在 `~/.openclaw/workspace/skills/` 下创建目录
- Web 下仅显示"导出下载"

#### 技术实现

- 自包含状态（`WizardData` + `useState`），不读写全局 workspace store
- `buildFrontmatter()` / `buildMarkdownBody()` / `serializeSkillMd()` 生成预览
- `createLocalSkillBundle(skillName, skillMd, options)` 调用 Tauri FS 插件创建目录和文件
- 向导关闭后通过 `onCreated` 回调通知 `NavigatorPanel`

#### 涉及文件

- `src/components/skill-wizard/skill-wizard.tsx`
- `src/lib/tauri-fs.ts`（`createLocalSkillBundle`）

---

## 4. 技术架构

### 4.1 整体架构

```
┌─ Tauri Shell ──────────────────────────────────────────────────┐
│                                                                │
│  ┌─ Web View (React SPA) ───────────────────────────────────┐  │
│  │                                                           │  │
│  │  App.tsx                                                  │  │
│  │  └─ ErrorBoundary + Suspense                              │  │
│  │     └─ WorkspaceShell (lazy)                              │  │
│  │        ├─ WorkspaceContext.Provider                        │  │
│  │        │  └─ useWorkspaceReducer(skills)                  │  │
│  │        ├─ PanelSyncContext.Provider                        │  │
│  │        │  └─ usePanelSync(skill, fm)                      │  │
│  │        └─ ResizablePanels                                 │  │
│  │           ├─ NavigatorPanel (20%)                          │  │
│  │           └─ Right Column (80%)                            │  │
│  │              ├─ ArchitectureBar                            │  │
│  │              ├─ EditorPanel (50%)  BridgeConnector  InspectorPanel (50%)  │
│  │              ├─ RelationHover (overlay)                    │  │
│  │              ├─ RelationBar                                │  │
│  │              └─ ContextBar                                 │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                │
│  Rust Backend (Tauri)                                          │
│  ├─ @tauri-apps/plugin-fs → 读写 ~/.openclaw/workspace/skills/ │
│  ├─ @tauri-apps/plugin-dialog → 原生对话框                     │
│  └─ tauri-plugin-log → 日志                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**关键架构决策**：

- **无传统后端**：不存在 Express/API 服务，文件读写通过 Tauri 插件直接访问本地文件系统
- **纯前端 SPA**：所有解析、编辑、序列化逻辑在浏览器端完成
- **双环境**：Tauri 桌面（可保存）/ 纯 Web（只读 + 导出），通过 `isTauri()` 运行时判断
- **React Context 状态管理**：不使用 Redux/Zustand，用 `useReducer` + `Context` 管理全局状态

### 4.2 技术栈与依赖


| 类别          | 选择                                  | 版本                           | 用途                                                              |
| ----------- | ----------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| 前端框架        | React + TypeScript                  | React 19, TS 5.9             | —                                                               |
| UI 组件       | shadcn/ui (Radix)                   | v4                           | Dialog, DropdownMenu, AlertDialog, Badge, Switch, Input, Tabs 等 |
| CSS         | Tailwind CSS                        | v4                           | 与 index.css 中大量手写 CSS 类并用                                       |
| 构建          | Vite                                | v8                           | HMR, code splitting, ?raw imports                               |
| 分栏布局        | react-resizable-panels              | v4.9                         | 三栏可调面板                                                          |
| 桌面封装        | Tauri                               | v2.10                        | fs/dialog/log 插件                                                |
| 状态管理        | React Context + useReducer          | —                            | `WorkspaceContext`, `PanelSyncContext`                          |
| 表单          | react-hook-form + Zod               | RHF 7.72, Zod 4.3            | Frontmatter 全字段表单（向导等场景）                                        |
| 国际化         | i18next + react-i18next             | i18next 26, react-i18next 17 | zh/en                                                           |
| Markdown 解析 | unified + remark-parse + remark-gfm | unified 11                   | AST 双向解析，用于附加文件                                                 |
| YAML        | yaml (npm)                          | 2.8                          | frontmatter 解析和序列化                                              |
| 语法高亮        | sugar-high                          | 1.1                          | 代码文件只读高亮（1KB gzip, 0 deps）                                      |
| 图标          | lucide-react                        | 1.7                          | 全局图标库                                                           |
| Toast       | sonner                              | 2.0                          | 保存成功/失败通知                                                       |


### 4.3 项目目录结构

```
src/
├── App.tsx                        # 根组件：ErrorBoundary + Suspense + lazy WorkspaceShell
├── main.tsx                       # 入口：createRoot + i18n 初始化
├── index.css                      # 全局样式：Tailwind + 手写 CSS 类体系
│
├── components/
│   ├── workspace-shell.tsx        # 主工作区壳层：Provider 包裹 + 面板布局
│   ├── workspace/
│   │   ├── navigator-panel.tsx    # 左栏：技能列表 + 文件树 + CRUD
│   │   ├── editor-panel.tsx       # 中栏：8 区块展示/编辑 + 路由分发
│   │   ├── inspector-panel.tsx    # 右栏：源码预览 + 保存/导出
│   │   ├── bridge-connector.tsx   # SVG 桥线连接器
│   │   ├── context-bar.tsx        # 底部上下文栏
│   │   ├── architecture-bar.tsx   # 顶部架构层导航
│   │   ├── relation-hover.tsx     # 关系气泡（事件委托 overlay）
│   │   ├── relation-bar.tsx       # 关系路径栏
│   │   ├── extra-file-editors.tsx # 附加文件编辑器
│   │   └── fragment-renderer.tsx  # 内容片段渲染组件
│   ├── config-editor/             # 配置文件编辑器
│   │   ├── config-editor.tsx      # 多配置 Tab（Phase 2 遗留）
│   │   ├── sources-editor.tsx     # sources.json 表单
│   │   ├── topics-editor.tsx      # topics.json 表单
│   │   ├── json-preview.tsx       # JSON 只读预览
│   │   └── export-button.tsx      # 下载按钮
│   ├── skill-editor/
│   │   ├── validation-panel.tsx   # 验证结果展示
│   │   └── frontmatter-form/     # Frontmatter 全字段表单（向导等用）
│   ├── skill-wizard/
│   │   └── skill-wizard.tsx       # 5 步创建向导
│   ├── layout/                    # Header
│   ├── ui/                        # shadcn/ui 组件
│   └── error-boundary.tsx         # 全局错误边界
│
├── hooks/
│   ├── use-workspace.ts           # WorkspaceContext + useReducer
│   ├── use-panel-sync.ts          # 面板同步 + 桥线 + 关系 + 层级
│   ├── use-theme.ts               # 暗色模式（V1.0 冻结）
│   └── use-mobile.ts              # 移动端检测
│
├── lib/
│   ├── skill-parser.ts            # SKILL.md → ParsedSkill
│   ├── skill-serializer.ts        # frontmatter + body → SKILL.md
│   ├── skill-validator.ts         # 验证规则
│   ├── markdown-engine.ts         # remark AST 引擎
│   ├── bridge-sections.ts         # 8 区块 + 6 层定义
│   ├── bridge-relations.ts        # 关系推断 + 动态存储
│   ├── tauri-fs.ts                # Tauri 文件系统操作
│   ├── download.ts                # 浏览器文件下载
│   ├── utils.ts                   # shadcn/ui cn() 工具
│   └── schemas/
│       └── frontmatter-schema.ts  # Zod schema + metadata helpers
│
├── types/
│   ├── skill.ts                   # ParsedSkill, SkillFrontmatter, SkillTool, ExtraFile
│   ├── workspace.ts               # WorkspaceState, WorkspaceAction, NavigatorSelection
│   └── content-fragment.ts        # ContentBlock, ContentSection, ParsedDocument
│
├── i18n/
│   ├── index.ts                   # i18next 初始化
│   └── locales/
│       ├── zh.json                # 中文（~330 行）
│       └── en.json                # English（同步）
│
├── data/
│   ├── skill-loader.ts            # 测试数据加载器
│   └── test-skills/               # 9 个真实 Skill 测试数据
│       ├── tech-news-digest/      # 完整结构：SKILL.md + config/ + scripts/ + references/
│       ├── url-reader/            # SKILL.md + metadata.json + scripts/
│       └── ... (7 more)
│
src-tauri/
├── src/lib.rs                     # Rust 入口（fs/dialog/log 插件）
├── Cargo.toml                     # Rust 依赖
├── tauri.conf.json                # 窗口配置（标题/尺寸/主题/安全）
└── capabilities/default.json      # 文件系统权限范围（~/.openclaw/）
```

### 4.4 状态管理

#### 全局状态（WorkspaceContext）

```typescript
interface WorkspaceState {
  skills: ParsedSkill[]              // 所有已加载技能
  selection: NavigatorSelection | null // 当前选中（skillId + nodeType + filePath?）
  editStates: Record<string, SkillEditState> // 按 skillId 索引的编辑状态
}

interface SkillEditState {
  frontmatter: SkillFrontmatter      // 编辑中的 frontmatter
  configFiles: Record<string, unknown> // 编辑中的配置文件
  extraFiles: Record<string, string>   // 编辑中的附加文件（path → content）
  dirty: boolean                       // 是否有未保存的修改
}
```

**Action 列表**


| Action               | 触发场景    | 效果                                               |
| -------------------- | ------- | ------------------------------------------------ |
| `SELECT`             | 点击导航树节点 | 切换 `selection`                                   |
| `UPDATE_FRONTMATTER` | 编辑区块保存  | 更新 editState.frontmatter + dirty=true            |
| `UPDATE_CONFIG`      | 配置编辑器修改 | 更新 editState.configFiles[path] + dirty=true      |
| `UPDATE_EXTRA_FILE`  | 附加文件编辑  | 更新 editState.extraFiles[path] + dirty=true       |
| `RESET_EDITS`        | —       | 删除 editStates[skillId]（丢弃所有编辑）                   |
| `SAVE_SKILL`         | 保存成功    | 同步 editState → skills[] + 删除 editStates[skillId] |
| `ADD_SKILL`          | 导入/创建   | 追加到 skills[] + 自动选中                              |
| `REMOVE_SKILL`       | 删除技能    | 从 skills[] 移除 + 清理 editStates + 选中回退             |


**EditState 懒创建**：`getOrCreateEditState()` — 首次编辑某 Skill 时从原始 `ParsedSkill` 数据 `structuredClone` 初始化，避免未编辑的 Skill 占用内存。

#### 面板同步状态（PanelSyncContext）

核心 hook `usePanelSync(skill?, fm?)` 管理以下状态：


| 状态                                           | 类型                   | 用途            |
| -------------------------------------------- | -------------------- | ------------- |
| `syncEnabled`                                | boolean              | 滚动同步开关        |
| `bridgeEnabled`                              | boolean              | 桥线显示开关        |
| `altHeld`                                    | boolean              | Alt 键按下状态     |
| `activePanel`                                | "editor"             | "inspector"   |
| `currentSection`                             | { id, index, total } | 当前视口区块        |
| `editorScrollPct` / `inspectorScrollPct`     | number               | 双侧滚动进度        |
| `selectedEid`                                | string               | null          |
| `selectedField`                              | string               | null          |
| `hoveredField`                               | string               | null          |
| `relatedEids`                                | string[]             | 与选中实体有关系的实体列表 |
| `currentLayer`                               | BridgeLayerId        | null          |
| `editorAllExpanded` / `inspectorAllExpanded` | boolean              | 全局展开/折叠       |
| `expandSyncEnabled`                          | boolean              | 折叠联动开关        |
| `drawTick`                                   | number               | 桥线重绘信号        |


### 4.5 数据流全链路

#### 加载流程

```
App.tsx useSkills()
  │
  ├─ Tauri 环境 → loadLocalSkills()
  │   └─ @tauri-apps/plugin-fs.readDir("~/.openclaw/workspace/skills/")
  │      → 每个子目录读取 SKILL.md + config/*.json
  │      → parseSkillMd() → ParsedSkill[]
  │
  └─ Web 环境 → loadTestSkills()
      └─ Vite ?raw import 静态文件
         → parseSkillMd() → ParsedSkill[]
```

#### 编辑流程

```
用户点击区块"编辑" → startEdit*() 拷贝 draft
  ↓
用户修改表单 → 更新 *Draft state
  ↓
用户点击"完成" → save*() 合并到 frontmatter 对象
  ↓
updateFrontmatter(skillId, newFm) → dispatch UPDATE_FRONTMATTER
  ↓
editStates[skillId] = { ...es, frontmatter: newFm, dirty: true }
  ↓
源码预览自动重新渲染（useMemo 依赖 editState.frontmatter）
  ↓
serializeSkillMd(fm, body) → 实时生成 SKILL.md 预览字符串
```

#### 保存流程

```
用户点击"保存" → handleSaveAll()
  ↓
1. serializeSkillMd(editState.frontmatter, markdownBody) → SKILL.md 内容
2. saveSkillFile(skillPath, "SKILL.md", content) → Tauri FS 写入
3. Object.entries(editState.configFiles).forEach → saveSkillConfig()
4. Object.entries(editState.extraFiles).forEach → saveSkillFile()
  ↓
全部成功 → markSaved(skillId, serializedContent)
  ↓
dispatch SAVE_SKILL → 更新 skills[] + 清除 editStates[skillId]
  ↓
toast.success("已保存") → dirty=false → 导航面板琥珀点消失
```

---

## 5. 核心子系统

### 5.1 SKILL.md 解析器

**文件**：`src/lib/skill-parser.ts`

**职责**：将 SKILL.md 文件内容解析为结构化 `ParsedSkill` 对象。

**核心函数**


| 函数                                | 输入                     | 输出                      | 说明                                   |
| --------------------------------- | ---------------------- | ----------------------- | ------------------------------------ |
| `parseSkillMd(content, id, path)` | 原始 MD 文本               | `ParsedSkill`           | 总入口                                  |
| `extractFrontmatter(content)`     | 原始 MD                  | `{ frontmatter, body }` | 正则匹配 `---\n...\n---`                 |
| `extractSections(body)`           | MD body                | `MarkdownSection[]`     | 按 heading 拆分，跳过代码块内的 `#`             |
| `extractTools(fm, sections)`      | frontmatter + sections | `SkillTool[]`           | 从 frontmatter.tools + ## Tools 子节点提取 |
| `extractEnvVars(fm)`              | frontmatter            | `EnvVarDefinition[]`    | 从 frontmatter.env 提取                 |


**解析策略**

- Frontmatter：正则提取 `^---\n(.*)\n---` → `yaml` 库 `parse()` → 直接作为 `SkillFrontmatter`
- Body sections：逐行扫描 heading（`#{1,6} title`），跳过 fenced code block 内的 heading
- Tools：优先从 frontmatter.tools 读取；再从 body 中 `## Tools` / `## Commands` / `## Scripts Pipeline` 下的 `###` 子节点提取
- 参数解析：匹配 `- param_name: type - description` 和 `--flag description` 两种模式

**设计约束**

- 不使用 remark AST（这是 V1.0 的历史决策，当时 SKILL.md 解析优先用轻量正则）
- `markdown-engine.ts` 的 remark 引擎仅用于附加文件（详见 5.2）
- 这是后续"统一解析架构"优化的核心改进点

### 5.2 Markdown 统一引擎

**文件**：`src/lib/markdown-engine.ts`

**职责**：基于 remark AST 的通用 Markdown 解析与序列化，用于附加文件（README.md / CHANGELOG.md 等）。

**核心函数**


| 函数                       | 输入               | 输出               | 说明                                           |
| ------------------------ | ---------------- | ---------------- | -------------------------------------------- |
| `parseDocument(content)` | MD 文本            | `ParsedDocument` | remark parse → 按 heading 拆分 → ContentBlock[] |
| `serializeDocument(doc)` | `ParsedDocument` | MD 文本            | 拼接 raw 字段                                    |
| `blockToRaw(block)`      | `ContentBlock`   | MD 片段            | 从编辑数据重建 raw                                  |


**数据模型**

```typescript
ParsedDocument {
  frontmatter?: { raw, data }      // YAML frontmatter（如果有）
  preamble: ContentBlock[]          // heading 前的内容
  sections: ContentSection[] {      // 按 heading 拆分
    id: string                      // "sec-1", "sec-2"...
    heading: { depth, text, raw }
    blocks: ContentBlock[]          // paragraph / list / code / table / blockquote / thematicBreak / html
  }
}
```

**处理流程**

```
Markdown text
  → remark parse → mdast AST (Root)
    → 遍历 children
      → yaml node → frontmatter
      → heading node → 新 section
      → 其他 node → nodeToBlock() → ContentBlock（保留 raw 用于 round-trip）
```

**关键设计**：每个 `ContentBlock` 保留 `raw` 字段（原始 MD 文本切片），序列化时直接拼接 `raw`，保证未编辑的内容 round-trip 不变。编辑后的 block 通过 `blockToRaw()` 从结构化数据重建 raw。

### 5.3 Frontmatter Schema

**文件**：`src/lib/schemas/frontmatter-schema.ts`

**职责**：用 Zod 定义 SKILL.md frontmatter 的完整 schema，作为类型系统的单一真相源。

**Schema 结构**

```
frontmatterSchema
├── Core: name (required), description
├── Identity: version, author, homepage, source, emoji
├── Trigger: read_when, triggers, trigger, auto_trigger,
│            user-invocable, disable-model-invocation,
│            command-dispatch, command-tool, command-arg-mode, allowed-tools
├── Env: env[] { name, required, description }
├── Tools: tools (passthrough, 由 skill-parser 独立处理)
├── Files: files { read[], write[] }
├── Metadata: metadata (passthrough, 内含 openclaw/clawdbot/clawdis)
└── .passthrough() → 保留未知字段
```

**Metadata 别名处理**

OpenClaw 生态中 metadata 键有多个别名（`openclaw` / `clawdbot` / `clawdis`），通过 helper 函数统一读写：

- `getOpenclawMetadata(metadata)` → 按优先级尝试读取
- `getOpenclawMetadataKey(metadata)` → 返回实际使用的 key 名
- `setOpenclawMetadata(metadata, value)` → 写入时保持原 key

**类型导出**

- `FrontmatterData = z.infer<typeof frontmatterSchema>` — 这就是 `SkillFrontmatter` 的实际类型
- `skill.ts` 中 `export type SkillFrontmatter = FrontmatterData` 做了重导出

### 5.4 面板同步系统

**文件**：`src/hooks/use-panel-sync.ts`

**职责**：编辑面板与预览面板之间的滚动同步、桥线绘制协调、字段联动、关系选中、架构层筛选。

**核心算法：分段线性映射**

```
左栏锚点 [e0, e1, e2, ..., en]  ←→  右栏锚点 [p0, p1, p2, ..., pn]
                     ↓
           mapScroll(src[], tgt[], scrollTop)
                     ↓
对于 scrollTop 在 [src[i], src[i+1]) 区间：
  tgt[i] + (scrollTop - src[i]) / (src[i+1] - src[i]) * (tgt[i+1] - tgt[i])
```

锚点来自 `buildAnchors(container)` — 扫描容器内所有 `[data-bridge-section]` 的 `offsetTop`。

**帧调度**

- 滚动事件触发 `scheduleFrame()` → `requestAnimationFrame` 单帧合并
- 帧内：重建锚点 → 执行映射 → 更新滚动位置 → 更新 UI 状态（scrollPct / currentSection / drawTick）

**字段联动机制**

- 编辑面板和预览面板的可映射元素带有 `data-field="f-xxx"` 属性
- `usePanelSync` 通过事件委托监听 `mouseover` / `mouseleave` 更新 `hoveredField`
- `useEffect` 根据 `hoveredField || selectedField` 在双侧 DOM 上添加/移除 `.fa` / `.fm` CSS 类
- `.fa`（active side）= hover 所在面板的高亮，`.fm`（mirror side）= 另一侧的镜像高亮

**scrollBothToSection(sectionId)**

- 在双侧查找 `[data-bridge-section="sectionId"]` → `scrollIntoView({ behavior: "smooth" })`
- 添加 `bridge-highlight` 类 → 1200ms 后移除

### 5.5 桥线连接器

**文件**：`src/components/workspace/bridge-connector.tsx`

**职责**：在编辑面板和预览面板之间的缝隙绘制 SVG 梯形连接线。

**绘制算法**

1. 从 `layoutRef` 获取缝隙区域的坐标系
2. 遍历编辑面板的 `[data-bridge-section]` → 与预览面板同 ID 配对
3. 计算每对区块的 `yTop` / `yBottom`（相对于布局容器）
4. 绘制梯形路径：左侧 top/bottom → 右侧 top/bottom
5. 高度差 > 3px 的边用虚线，否则实线
6. 颜色取自 `SECTION_MAP[sectionId].color`，无匹配时回退灰色

**交互**

- hover 桥线 → 两侧对应区块添加 `bridge-highlight` 类
- 点击桥线 → `scrollBothToSection(id)` 双面板跳转
- 缝隙中央有设置浮窗入口（同步/桥线/折叠联动三个开关）

**与 extra-file 的兼容**：桥线配对从扫描实际 DOM 中的 `data-bridge-section` 生成，而非遍历硬编码 `BRIDGE_SECTIONS`。因此 extra-file 的 `FileSection` 只要输出 `data-bridge-section` 就能自动参与桥线绘制。

### 5.6 关系推断引擎

**文件**：`src/lib/bridge-relations.ts`

**职责**：从 Skill 数据中启发式推断实体间的依赖关系。

**核心函数**：`buildBridgeRelations(skill, fm)` → `Record<string, BridgeRelation[]>`

**推断规则**


| 规则            | 源               | 目标             | 关系类型 | 方法                                              |
| ------------- | --------------- | -------------- | ---- | ----------------------------------------------- |
| 环境变量 → 脚本     | env var         | script         | →    | description 中关键词匹配脚本名                           |
| 环境变量互替        | env var A       | env var B      | ↔    | description 含 "fallback" / "alternative" + 对方名称 |
| 必需工具 → 脚本     | required bin    | script         | →    | python → 匹配 pipeline/run 脚本                     |
| 可选工具互替        | optional bin A  | optional bin B | ↔    | 同组内两两互替                                         |
| 主脚本 → 子脚本     | pipeline script | sub-script     | →    | 脚本名含 fetch/merge/generate/collect               |
| 配置目录 → 文件     | config-defaults | *.json         | ⊂    | files.read/write 路径含 config/defaults/           |
| 配置文件 → 脚本     | *.json          | script         | →    | 文件名关键词匹配                                        |
| 合并脚本 → topics | merge script    | topics.json    | →    | 脚本名含 "merge"                                    |
| PDF 脚本 → 工具   | generate-pdf    | weasyprint     | →    | 脚本名含 "generate.*pdf"                            |


**脚本名提取**：`extractScriptNames(skill)` — 遍历 body sections，匹配标题含 "脚本/script/pipeline" 的章节，从内容中提取 `script-name.py` 模式。

**存储与生命周期**

- 模块级 `_store` 变量，通过 `setRelationStore()` / `getRelationStore()` 读写
- 在 `usePanelSync` 中当 `skill` 或 `fm` 变化时自动 `buildBridgeRelations` 重建

### 5.7 序列化器

**文件**：`src/lib/skill-serializer.ts`

**职责**：将编辑后的 frontmatter 对象 + markdown body 序列化回 SKILL.md 文本。

**序列化策略**

1. `buildFrontmatterPayload(fm)` → 按固定顺序输出已知字段（name, description, version...），`undefined` 值跳过
2. 未知字段（不在 `KNOWN_KEYS` 中的）排序后追加
3. 深度清理 `undefined`：`deepOmitUndefined()` 递归处理嵌套对象和数组
4. `yaml` 库 `stringify(payload, { lineWidth: 0, defaultStringType: "QUOTE_DOUBLE" })`
5. 最终拼接 `---\n{yaml}\n---\n{body}`

**设计约束**：body 部分保持原始文本不变（V1.0 不编辑 body），仅 frontmatter 被序列化替换。这意味着 tools/exec/doc 区块的修改不会反映到保存内容中（V1.0 它们是只读的）。

---

## 6. UI 组件架构

### 6.1 三栏布局

**组件树**

```
WorkspaceShell
├── AppHeader (固定顶部)
├── ArchitectureBar (仅 skill-md 视图)
├── PanelGroup (横向)
│   ├── Panel "nav" (默认 20%)
│   │   └── NavigatorPanel
│   ├── PanelResizeHandle
│   └── Panel "right-col" (默认 80%)
│       └── (layoutRef 容器)
│           ├── PanelGroup (横向)
│           │   ├── Panel "editor"
│           │   │   └── EditorPanel
│           │   ├── PanelResizeHandle
│           │   └── Panel "inspector" (可折叠)
│           │       └── InspectorPanel
│           ├── BridgeConnector (absolute overlay)
│           └── RelationHover (absolute overlay)
│       ├── RelationBar
│       └── ContextBar
```

**布局行为**

- 概览视图（`skill-overview`）：Inspector 面板 `collapse()`
- 非概览视图：Inspector 面板 `expand()`，从概览切换时 `resize("50%")`
- `layoutRef` 绑在编辑+检查器的包裹 div 上，作为桥线 SVG 的坐标参考

### 6.2 区块系统

**BridgeSectionBlock**（SKILL.md 区块容器）

```typescript
Props {
  sectionId: string      // 区块 ID（basic/trigger/meta/...）
  title: string          // 显示名称
  color: string          // 主题色（左边框、圆点）
  badge?: ReactNode      // 可选徽章
  readOnly?: boolean     // 只读标记
  editable?: boolean     // 是否可编辑
  editing?: boolean      // 当前是否在编辑态
  onEdit/onCancel/onDone // 编辑操作回调
  defaultCollapsed?: boolean
  dimmed?: boolean       // 架构层筛选时暗化
  children              // 区块内容
}
```

输出 DOM：`[data-bridge-section="xxx"]` → 参与桥线配对、滚动同步、字段联动。

**FileSection**（附加文件区块容器）

与 `BridgeSectionBlock` 视觉一致（复用 CSS 类），但额外支持 `sectionId` prop 用于桥线配对。中性灰色 `#64748b` 主题。

**PreviewSectionBlock**（预览面板区块容器）

与编辑侧 `BridgeSectionBlock` 镜像对应。内容通过 `dangerouslySetInnerHTML` 注入（带语法高亮和实体标注的 HTML）。

### 6.3 编辑态表单体系

**控件层级**

```
BridgeSectionBlock (容器 + 编辑/展示态切换)
├── 展示态：BasicInfoDisplay / TriggerDisplay / MetaOpenclawView / ...
└── 编辑态：BasicEditForm / TriggerEditForm / MetaEditForm / ...
    ├── InlineTagInput — 标签输入（triggers, bins, os 等数组字段）
    ├── InlineToggle — 布尔开关（auto_trigger, user-invocable 等）
    ├── <input className="fi"> — 文本输入
    ├── <textarea className="ft"> — 多行文本
    └── 动态表格 — ENV 变量、文件路径列表（增删行）
```

**CSS 类体系**（定义在 `index.css`）


| 类名                                              | 用途                    |
| ----------------------------------------------- | --------------------- |
| `.ecard`                                        | 区块内卡片容器               |
| `.fr`                                           | 展示态字段行（label + value） |
| `.fl` / `.fv`                                   | 字段行 label / value     |
| `.ef-row`                                       | 编辑态字段行                |
| `.ef-lbl`                                       | 编辑态 label（右对齐 50px）   |
| `.fi`                                           | 文本输入框                 |
| `.ft`                                           | 多行文本域                 |
| `.ftg` / `.ftg-track` / `.ftg-thumb`            | Toggle 开关             |
| `.fta` / `.ftag` / `.fti`                       | Tag input 系列          |
| `.eb` / `.eb-group` / `.eb-cancel` / `.eb-done` | 编辑按钮组                 |
| `.editing-ind`                                  | "编辑中" 指示器             |
| `.et-del` / `.et-add`                           | 表格增删按钮                |
| `.tg-pill`                                      | 标签 pill               |
| `.bool-on` / `.bool-off`                        | 布尔值展示                 |


### 6.4 内容片段渲染

**文件**：`src/components/workspace/fragment-renderer.tsx`

`FragmentBlock` 根据 `ContentBlock.type` 分发：


| Block 类型      | 展示态                    | 编辑态                      |
| ------------- | ---------------------- | ------------------------ |
| paragraph     | `<pre>` pre-wrap 文本    | auto-resize `<textarea>` |
| list          | `<ul>` / `<ol>`        | 逐项 `<input>` + 增删按钮      |
| code          | sugar-high 语法高亮 + 语言标签 | — （只读）                   |
| table         | 格式化 HTML `<table>`     | — （只读）                   |
| blockquote    | 左边框引用                  | `<textarea>`             |
| thematicBreak | `<hr>`                 | —                        |
| html          | `<pre>`                | —                        |


每个 `FragmentBlock` 可选 `fieldId` prop → 输出 `data-field` 属性参与字段级联动。

---

## 7. 构建与部署

### 7.1 代码分割策略

**入口拆分**

- `App.tsx`（首屏）：仅 ErrorBoundary + Suspense + `React.lazy(() => import("workspace-shell"))`
- `WorkspaceShell`：包含完整 UI，lazy 加载
- 测试数据 `skill-loader.ts`：dynamic `import()` 异步加载

**编辑器子视图 lazy 加载**

- `SourcesEditor` / `TopicsEditor` / `SchemaViewer` / `ExtraFileEditor` / `ValidationPanel`

**效果**

- 首屏 JS：243 KB（gzip 78 KB），从 1,235 KB 降 80%
- 总 chunk 数：22（按需加载）
- CSS：109 KB

### 7.2 Tauri 桌面封装

**架构**：Tauri v2 — Rust 后端 + Web 前端（WebView）

**启用的插件**

- `@tauri-apps/plugin-fs`：读写 `~/.openclaw/workspace/skills/` 目录
- `@tauri-apps/plugin-dialog`：原生文件对话框
- `tauri-plugin-log`：日志

**权限配置**（`capabilities/default.json`）

- 文件系统权限范围限定为 `~/.openclaw/` 目录

**运行时判断**：`isTauri()` — 检查 `window.__TAURI__` 是否存在。不同环境的行为差异：

- 数据加载：Tauri → `loadLocalSkills()`（读本地文件系统）；Web → `loadTestSkills()`（内置测试数据）
- 保存：Tauri → 文件写入；Web → 不可保存，只能导出下载
- 创建向导：Tauri → "本地创建" + "导出下载"；Web → 仅 "导出下载"

### 7.3 国际化

**框架**：i18next + react-i18next

**配置**

- 默认语言：中文（`zh`），fallback 也是中文
- 语言持久化：`localStorage.getItem("skillforge-lang")`
- 切换入口：Header 中的语言切换按钮

**覆盖范围**

- zh.json / en.json 各 ~330 行
- 命名空间：`workspace.{section, field, action, empty, bridge, contextBar, file, nav, configEditor, validation, wizard}`
- 14 个组件完成 i18n，覆盖所有 UI 文本
- `ErrorBoundary` 保持硬编码（类组件 + 错误边界不应依赖 i18n）
- 向导中生成文件内容的文本保持中文（非 UI 文本）

---

## 8. 已知限制与演进方向

### V1.0 已知限制


| 限制                   | 说明                                               | 影响                    |
| -------------------- | ------------------------------------------------ | --------------------- |
| **双解析器并存**           | SKILL.md 用正则解析器，附加文件用 remark AST 引擎              | 两套解析逻辑需分别维护           |
| **Body 不可编辑**        | tools/exec/doc 区块只读，编辑不写入 body                   | 用户只能编辑 frontmatter 部分 |
| **纯暗色模式**            | V1.0 冻结 dark，无 light mode                        | —                     |
| **无跨文件校验**           | 引用的脚本文件是否存在等不检查                                  | 可能保存后运行时报错            |
| **关系推断靠启发式**         | 基于关键词匹配，可能漏判或误判                                  | 复杂 Skill 需人工确认        |
| **ConfigEditor 双路径** | Phase 2 遗留的 `config-editor.tsx` 与 workspace 路径并存 | 代码冗余                  |
| **创建向导不写全局状态**       | 向导创建的 Skill 通过文件系统中转，Web 端无法直接加入列表               | Web 用户需手动导入           |


### V1.1 规划方向


| 方向           | 关键任务                                                           |
| ------------ | -------------------------------------------------------------- |
| **统一解析架构**   | 合并 skill-parser 和 markdown-engine，统一为 remark AST → 所有文件类型走同一管线 |
| **Body 可编辑** | doc/exec 区块从只读变可编辑，涉及 body 解析→修改→序列化闭环                         |
| **编辑校验**     | frontmatter 编辑触发 Zod 校验 + 行内错误提示                               |
| **组件抽象**     | `BridgeSectionBlock` 和 `FileSection` 提取公共抽象层                   |
| **代码联动增强**   | extra-file 的字段级精确联动（左侧字段 hover 高亮右侧代码行）                        |
| **在线导入**     | ClawHub 搜索 + GitHub URL 导入                                     |
| **主题系统**     | dark/light 双模式                                                 |


### 解析流程优化方向

当前 SKILL.md 的解析和预览存在两条独立路径：

**当前架构**

```
SKILL.md 原文
├──→ skill-parser.ts （正则）→ ParsedSkill（编辑面板数据）
└──→ splitPreviewInto8() （正则）→ 8 段 HTML（预览面板）
     └──→ buildSectionHtml() → highlightYaml() + wrapFields() + injectEntities()
```

**目标架构（V1.1+）**

```
SKILL.md 原文
└──→ 统一 remark 引擎 → ParsedDocument
    ├──→ 编辑面板：section → 表单组件
    ├──→ 预览面板：section → 渲染 HTML（复用 fragment-renderer）
    └──→ 序列化：serializeDocument() → SKILL.md
```

统一后的好处：

1. 一次解析两面用，消除双路径维护
2. Body 编辑自然支持（FragmentBlock 已有编辑能力）
3. 实体注入可在 AST 层面操作，而非在 HTML 字符串上正则替换
4. Round-trip 保真度更高（remark 保留 position 信息）

---

> 本文档随产品版本演进持续更新。下次修改时同步更新顶部日期。

