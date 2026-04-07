# F2+F3 区块级编辑 + UI 对齐 执行记录

**日期**: 2026-04-07
**执行模式**: Opus 规划/审查/核心编码 + fast 子 Agent 编写 CSS 和 inspector-panel

## 调研记录

本次无需调研。原因：
- 纯编辑态 UI 实现，所有交互规格已在 P2 Demo（`06-inline-edit.html`）中定义
- 技术栈沿用现有选型（React + Tailwind + CSS），不引入新依赖
- 表单控件从 Demo HTML/CSS 直接翻译为 React JSX，无需搜索参考方案

## 批次执行

### 步骤 1：bridge-sections.ts + CSS 基础设施

- 操作：
  - `bridge-sections.ts`：新增 `trigger` 区块（`{ id: "trigger", name: "触发条件", color: "#f97316", layer: "identity" }`），插入 basic 和 meta 之间
  - `index.css`：从 Demo 移植全部编辑态 CSS（~340 行），涵盖 trigger 区块色、展示辅助、编辑控件、表单系统、列表/表格
- 结果：7 区块 → 8 区块，编辑态视觉基础就绪

### 步骤 2：BridgeSectionBlock 重构

- 操作：新增 `editable/editing/onEdit/onCancel/onDone` props
  - 编辑按钮：`.eb` 文字按钮（"编辑"），在标题行右侧 `margin-left:auto`
  - 编辑中：`.eb-group`（pencil SVG + "编辑中" + "取消" + "完成"）
  - `.editing` 类添加到 section 根元素
- 结果：BridgeSectionBlock 成为统一的编辑态容器

### 步骤 3：展示组件 + 编辑表单

- 操作：
  - `BasicInfoDisplay` 重写：新增 emoji/author 行，移除旧"编辑全部字段"按钮
  - `TriggerDisplay`（新建）：tag pill + bool badge + 命令字段
  - `MetaOpenclawView` 增强：使用 `getOpenclawMetadata`，新增 OS 显示
  - `InlineTagInput` + `InlineToggle`：Demo 风格轻量级控件
  - 5 个编辑表单：`BasicEditForm`/`TriggerEditForm`/`MetaEditForm`/`EnvEditForm`/`FilesEditForm`
  - `SkillMdPanel` 完整重写：8 区块渲染 + 5 个独立编辑状态 + draft snapshot/save/cancel 逻辑
- 结果：5 个可编辑区块 + 3 个只读区块全部就绪

### 步骤 4：inspector-panel trigger 支持

- 操作（fast 子 Agent）：
  - `PreviewParts` 增加 `trigger` 字段
  - `splitPreviewInto8`：提取 trigger YAML 键
  - `buildSectionHtml` + `buildInspectorEntityRules` 增加 trigger case
  - `BASIC_FIELD_MAP` 增加 emoji/author
- 结果：预览面板完整支持 8 区块

### 步骤 5：验收

- tsc: ✅（0 errors）
- build: ✅（vite 432ms）
- linter: ✅（0 errors）
- 浏览器验证: ✅
  - trigger 区块橙色，位置正确
  - 5 个可编辑区块有"编辑"按钮
  - 编辑/保存/取消流程正常
  - 保存后展示值更新 + "已修改"徽章出现
  - 3 个只读区块有🔒标记

## 子 Agent 使用情况

| 任务 | 模型 | 质量 | 备注 |
|---|---|---|---|
| CSS 移植到 index.css | fast | ✅ | 精确执行，无需修改 |
| inspector-panel trigger 支持 | fast | ✅ | 正确完成全部 5 处修改，还主动补充了 BASIC_FIELD_MAP |
| 浏览器验证 | browser-use | ✅ | 确认核心功能正常 |

## 架构决策

1. **编辑状态管理**：选用 `useState` + `structuredClone` 而非 `react-hook-form`
   - 原因：区块级编辑只涉及 5-8 个字段，react-hook-form 的 Controller 模式反而增加复杂度
   - 后续可在编辑优化阶段（Undo/Redo、Dirty 追踪）引入 `useReducer` + `immer`
2. **控件选择**：新建 `InlineTagInput`/`InlineToggle` 而非复用 shadcn/ui TagInput
   - 原因：Demo 风格控件（`.fta/.ftg`）与 shadcn Badge/Input 视觉差异大，直接翻译 Demo 更一致
3. **多区块并行编辑**：允许多个区块同时处于编辑态
   - 原因：Demo 不限制单区块编辑，用户可能需要同时编辑 basic 和 trigger

## 验收确认
- `npm run dev`: ✅
- `npm run build`: ✅
- `npx tsc -b --noEmit`: ✅
- 浏览器验证: ✅（编辑/保存/取消流程、trigger 区块、只读标记）

## 未完成项（移入 backlog 编辑优化）

- Undo/Redo（Ctrl+Z / Ctrl+Shift+Z）
- 表单校验（version 格式、URL 格式、必填项）
- 键盘快捷键（Ctrl+S 保存、Escape 取消）
- Dirty 状态追踪（切换 Skill 时提示未保存）
- 草稿自动暂存（localStorage）
