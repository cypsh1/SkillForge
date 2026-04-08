# V1-3 其他文件类型适配 执行记录

**日期**: 2026-04-07
**执行模式**: Opus 规划/审查 + fast 子 Agent 编写代码

## 调研记录

### 搜索内容
- 搜索 1："lightweight syntax highlighting JavaScript library no Monaco 2026" → 找到 sugar-high（1KB）、Prism（2MB）、highlight.js（5MB）、speed-highlight（2KB）
- 搜索 2："sugar-high syntax highlighting React npm size bundle" → 确认 1KB gzip、0 依赖、支持 Python preset
- 搜索 3："sugar-high presets supported languages python bash shell" → 确认支持 Python/CSS/Rust/C/Go/Java，不支持 Bash

### 调研结论
- 选定 sugar-high@1.1.0，对比过 Prism（2MB 太重）、highlight.js（5MB 太重）、speed-highlight（2KB 但 React 集成不如 sugar-high 简洁）
- Shell 高亮通过自定义 HighlightOptions 实现（keywords Set + onCommentStart for #）

## 批次执行

### B1：类型扩展 + Workspace reducer（Opus 直接写）
- `types/skill.ts`：新增 `ExtraFileType`（json/markdown/python/shell/text）和 `ExtraFile` interface，`ParsedSkill` 增加 `extraFiles: Record<string, ExtraFile>`
- `types/workspace.ts`：`NavigatorNodeType` 增加 `"extra-file"`，`SkillEditState` 增加 `extraFiles: Record<string, string>`，新增 `UPDATE_EXTRA_FILE` action
- `use-workspace.ts`：reducer 增加 `UPDATE_EXTRA_FILE` case，`getOrCreateEditState` 从 skill.extraFiles 初始化编辑内容，context 暴露 `updateExtraFile`
- `skill-parser.ts`：初始化 `extraFiles: {}`
- tsc ✅

### B2：安装 sugar-high + 数据加载（fast 子 Agent）
- `npm install sugar-high`（v1.1.0）
- `skill-loader.ts`：为 3 个 skill 加载 11 个 extra files
  - tech-news-digest：7 文件（_meta.json, CHANGELOG.md, README.md, .clawhub/origin.json, scripts/fetch-rss.py, scripts/test-pipeline.sh, references/digest-prompt.md）
  - url-reader：3 文件（metadata.json, README.md, scripts/wechat_reader_v2.py）
  - image-ocr：1 文件（_meta.json）
- 新增 `inferFileType` + `makeExtraFile` helper
- tsc ✅

### B3：Navigator 树扩展（fast 子 Agent）
- `navigator-panel.tsx`：
  - 新增 `FileCode`/`Terminal` icon import
  - `selectionMatches` 支持 `"extra-file"` nodeType
  - `extraFileIcon` 根据文件类型返回对应图标
  - `ExtraFilesSubtree` 组件：按目录分组（root files + folders），文件夹用 `FolderOpen` 图标
  - `SkillTreeBlock` expanded 区域追加 `ExtraFilesSubtree`
- tsc ✅

### B4：编辑器组件 + 路由（Opus 直接写）
- 新建 `extra-file-editors.tsx`：
  - `ExtraFileEditor`：路由组件，根据文件类型分发到 4 种子编辑器
  - `JsonFormEditor`：`_meta.json` 可编辑表单（ef-row 布局，boolean toggle，number/string 自动转换）
  - `JsonViewer`：通用 JSON 只读查看（JSON.stringify 格式化 + sugar-high 高亮）
  - `MarkdownFileEditor`：预览/编辑切换（默认 monospace 预览 + "编辑"按钮 → textarea + 完成/取消）
  - `CodeViewer`：Python/Shell 只读查看（sugar-high + python preset / 自定义 shell config）
- `editor-panel.tsx`：新增 `extra-file` 路由分支，从 selectedSkill.extraFiles 获取文件，传递 editContent + onUpdate
- `index.css`：sugar-high CSS 变量（--sh-keyword 粉色、--sh-string 绿色、--sh-comment 灰色等）+ `.sh-code` 样式
- tsc ✅ linter ✅

### B5：验证
- `npm run build` ✅（1065KB JS + 108KB CSS）
- 浏览器验证：
  - Navigator 树：tech-news-digest 显示 SKILL.md + config/ + 7 extra files（按目录分组）✅
  - `_meta.json`：JSON 表单编辑器（4 个 input 字段）✅
  - `.clawhub/origin.json`：JSON 只读查看器（语法高亮）✅
  - `CHANGELOG.md`：Markdown 预览 + "编辑"按钮 ✅
  - `scripts/fetch-rss.py`：Python 代码查看器（561 行，语法高亮，🔒 只读）✅
  - `scripts/test-pipeline.sh`：Shell 代码查看器（307 行，语法高亮，🔒 只读）✅

### 额外修复
- `use-workspace.ts`：`skill.extraFiles ?? {}` 防御性检查（HMR 热更新时旧 state 无此字段）

## 子 Agent 使用情况

| 任务 | 模型 | 质量 | 备注 |
|---|---|---|---|
| B2 安装 sugar-high + 数据加载 | fast | ✅ | 完全按指令执行，无需修改 |
| B3 Navigator 树扩展 | fast | ✅ | 完全按指令执行，无需修改 |

## 验收确认
- `npx tsc -b --noEmit`: ✅
- `npm run build`: ✅
- `npx tsc -b --noEmit`（linter）: ✅
- 浏览器验证: 5 种文件类型全部通过（JSON 表单/JSON 查看/Markdown/Python/Shell）

## V1-3 优化轮

基于用户反馈，对 V1-3 产出做视觉体系对齐优化。

### 问题清单
1. Navigator 节点缺少描述行
2. JSON 文件直接进入编辑态
3. Markdown 文件未按 heading 分段
4. 编辑按钮组错位（未复用 `.eb-group`）
5. JSON 只读文件用代码预览而非表单
6. 代码文件缺少区块容器包装

### 修复内容

- **extra-file-editors.tsx 重写**：
  - `FileSection` 通用容器：复用 `bridge-section-header` / `bridge-section-content` / `bridge-section-collapsed` CSS 类 + `.eb` / `.eb-group` / `.editing-ind` 编辑控件
  - `JsonFileEditor`：展示态（`.fr` + `.fl` + `.fv` 字段行）→ 编辑态（`.ef-row` + `.fi` / `.ftg` 表单）
  - `MarkdownFileEditor`：`parseMdFile()` 按 `##` 拆分为 sections，每段独立 FileSection（可折叠、可编辑），`rebuildMdFile()` 保存时重组全文
  - `CodeFileViewer`：FileSection 包装（标题"源代码" + 语言 badge + 🔒 只读 + 行数）
- **navigator-panel.tsx**：`extraFileDescription()` 为每种文件类型提供描述文本
- **index.css**：`.file-section`（`border-left: 2px solid var(--border)` + `.editing` 高亮）

### 验收
- tsc ✅ build ✅ 浏览器验证 8 项全部通过 ✅
