# D5-BUG2: Inspector 字段级镜像映射补齐 执行记录

**日期**: 2026-04-06
**执行模式**: Opus 直接修复

## 调研记录

### 搜索内容
- 无外部调研。本次属于 Demo 对齐遗漏修复，直接对照 `public/demos/05-complete.html` 与主应用实现定位。

### 调研结论
- 豁免调研：纯交互补齐型 bug 修复，不涉及新功能、新依赖或新技术选型。

## 问题定位

- Demo 中，`可视化编辑` 与 `源码预览` 在 section 内部存在字段级镜像关系：
  - 左侧 editor 行块为 `[data-field]`
  - 右侧 inspector 对应段也包裹为 `.pf[data-field]`
  - 点击任一侧字段块，另一侧对应块进入 `fa/fm` 映射高亮
- 主应用此前只在 `basic` 区做了 `.pf[data-field]` 包装。
- `env/tools/files/exec/doc` 缺失整段包装，导致：
  - editor 点击后，inspector 往往只有局部实体 `.en` 高亮
  - 不能形成 Demo 的整行/整段镜像选中体验

## 同类模块排查

- `basic`: 已有 `.pf[data-field]`，此前已修过间距问题
- `meta`: Demo 本身未提供字段级块映射，保留只读文本结构
- `env / tools / files / exec / doc`: 均存在同类缺失，已统一补齐

## 批次执行

### 步骤 1：补齐 Inspector 字段块包装逻辑
- 操作：修改 `src/components/workspace/inspector-panel.tsx`
- 新增能力：
  - `wrapYamlListBlocks()`：为 `env / tools` 的列表项按字段包裹 `.pf[data-field]`
  - `wrapYamlNamedBlocks()`：为 `files.read / files.write` 包裹 `.pf[data-field]`
  - `wrapMarkdownHeadingBlocks()`：为 `exec / doc` 的 markdown heading chunk 包裹 `.pf[data-field]`
  - `buildSectionHtml()`：按 section 类型统一生成带字段包装的 preview HTML
- 结果：Inspector 从仅 `basic` 支持字段镜像，扩展为 `basic/env/tools/files/exec/doc` 全覆盖

## 验收确认
- `npx tsc -b --noEmit`: ✅
- lints: ✅ `ReadLints` 无新增问题
- 浏览器验证: ✅ `env` 区点击 `GITHUB_TOKEN` 后，右侧对应字段块进入镜像高亮；反向点击右侧字段块也可保持映射

## 修改文件清单

| 文件 | 修改类型 |
|---|---|
| `src/components/workspace/inspector-panel.tsx` | Inspector 各 section 的字段级 `.pf[data-field]` 包装补齐 |
| `project-harness/context/current-state.md` | 记录 D5-BUG2 |
| `project-harness/workflow/backlog.md` | 记录 D5-BUG2 完成 |
