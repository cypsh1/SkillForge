# Batch 2 区块交互对齐（A2×4）执行记录

**日期**: 2026-04-07
**执行模式**: Opus 直接编写（改动精确、文件少，不需要委派）

## 调研记录

纯对齐修复，基准为 `demo-05-behavior-spec.md` §4 和 `demo-05-alignment-checklist.md` A2 小节，无需外部调研。

## 批次执行

### 步骤 1：use-panel-sync.ts — 新增 scrollBothToSection API
- 操作：新增 `highlightTimerRef`；实现 `scrollBothToSection(sectionId)` callback：双面板 `scrollIntoView({ behavior: "smooth" })` + `classList.add("bridge-highlight")` + 1.2s 后清除 + 300ms 后 `rebuildAnchors()`
- 结果：API 接口和返回值均已扩展

### 步骤 2：editor-panel.tsx — BridgeSectionBlock header 拆分
- 操作：header div `onClick` 改为 `api?.scrollBothToSection(sectionId)`；caret span 新增 `onClick` 含 `e.stopPropagation()` + `setCollapsed(!collapsed)`
- 结果：箭头仅折叠，标题区仅跳转

### 步骤 3：inspector-panel.tsx — PreviewSectionBlock header 拆分
- 操作：同 editor 侧。caret 同时增加 `onKeyDown`（Enter/Space）+ `role="button"` + `tabIndex={0}`
- 结果：与 editor 侧行为对齐，保持无障碍访问

### 步骤 4：index.css — 折叠动画 + hover box-shadow
- 操作：
  - 新增 `.bridge-section-content { max-height: 2000px; opacity: 1; overflow: hidden; transition: max-height .25s ease, opacity .2s; }`
  - 7 个 `[data-bridge-section="xxx"].bridge-highlight` 均新增 `box-shadow: inset 0 0 0 1px rgba(255,255,255,.07)`
- 结果：折叠/展开有过渡动画，高亮态有 inset border 效果

## 对齐清单验收

| # | 项目 | 状态 | 备注 |
|---|---|---|---|
| A2-1 | 标题行点击 → 双面板跳转 + 高亮 1.2s | ✅ | `scrollBothToSection` API 实现 |
| A2-2 | 箭头与标题行功能分离 | ✅ | `stopPropagation` 隔离 |
| A2-3 | 折叠动画 transition | ✅ | `max-height .25s ease, opacity .2s` |
| A2-4 | hover box-shadow | ✅ | `inset 0 0 0 1px rgba(255,255,255,.07)` |

## 子 Agent 使用情况

| 任务 | 模型 | 质量 | 备注 |
|---|---|---|---|
| （无） | — | — | 本次改动精确、文件少，由 Opus 直接完成 |

## 验收确认
- `npx tsc -b --noEmit`: ✅
- `npm run build`: ✅（932KB JS + 98KB CSS）
- Linter: ✅
- 浏览器验证: 右面板标题点击确认不触发折叠 ✅；动画效果和 1.2s 高亮消退待人工复核

## 注意事项
- 浏览器自动化测试受 SVG 桥线覆盖层 `pointer-events` 影响，部分交互点击被拦截。核心逻辑已通过代码审查和部分浏览器验证确认正确。建议人工在浏览器中复核：
  1. 点击左面板区块标题文字 → 双面板同时滚动 + 背景色+box-shadow 高亮 1.2s
  2. 点击左面板区块 ▼ 箭头 → 仅折叠/展开，有过渡动画
  3. hover 区块（通过桥线触发）→ 可见 inset box-shadow
