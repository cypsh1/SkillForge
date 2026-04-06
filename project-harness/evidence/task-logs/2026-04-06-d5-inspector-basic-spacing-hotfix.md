# D5-BUG: Inspector basic 预览间距 hotfix 执行记录

**日期**: 2026-04-06
**执行模式**: Opus 直接修复

## 调研记录

### 搜索内容
- 无外部调研。本次属于纯样式/结构 bug 修复，直接对照 `public/demos/05-complete.html` 与现有实现定位问题。

### 调研结论
- 豁免调研：问题为已知 Demo 对齐偏差，不涉及新功能、新交互或新技术选型。

## 问题定位

- 用户指出 Inspector 右侧 `basic` 预览块的段间距明显大于 Demo。
- 对照后确认根因不在 `.pc` 的 `line-height: 1.65`，而在 `splitPreviewInto7()`：
  - 主应用把 `name / description / version / homepage` 用 `join("\n\n")` 拼接，字段之间人为插入了一整行空白。
  - Demo 的 `basic` 区是连续 `.pf` 块，中间没有额外空行，且块首包含 `---`。

## 同类模块排查

- `meta / env / tools / files`：直接取 frontmatter 原始 block，没有额外注入空白行。
- `exec / doc`：使用 `join("\n\n")` 仅用于拼接 markdown 章节边界，属于正文级分段，不是字段列表间距问题。
- 结论：本次需要修复的同类问题仅存在于 `basic` 预览块。

## 批次执行

### 步骤 1：修复 basic 预览拼接逻辑
- 操作：修改 `src/components/workspace/inspector-panel.tsx`
- 变更：
  - `basic` 从 `join("\n\n")` 改为紧凑拼接
  - 当存在 basic 字段时，在块首补入 `---`
- 结果：Inspector `basic` 预览结构与 Demo 保持一致

## 验收确认
- `npx tsc -b --noEmit`: ✅
- 浏览器验证: ✅ `basic` 区块空段距消失，顶部 `---` 已补回
- lints: ✅ `ReadLints` 无新增问题

## 修改文件清单

| 文件 | 修改类型 |
|---|---|
| `src/components/workspace/inspector-panel.tsx` | `basic` 预览拼接逻辑修复 |
| `project-harness/context/current-state.md` | 记录 hotfix |
| `project-harness/workflow/backlog.md` | 记录 D5-BUG 完成 |
