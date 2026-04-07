# Batch 3 桥线+气泡对齐（A3×2 + A4×3）执行记录

**日期**: 2026-04-07
**执行模式**: Opus 直接编写（改动量小，5 项均为精确对齐，不委派）

## 调研记录

纯对齐修复，基准为 `demo-05-behavior-spec.md` + `demo-05-alignment-checklist.md`，无需外部调研。
直接对照 demo `05-complete.html` 源码确认行为规格。

## 批次执行

### A3-1：桥线点击 → 双面板跳转 + 高亮 1.2s

- **操作**：`bridge-connector.tsx` — `onClick` 从独立 `scrollBothTo(b.id, er, ir)` 改为 `api.scrollBothToSection(b.id)`
- **副作用清理**：删除独立 `scrollBothTo` 函数（仅此处使用）；删除 `RefObject` import；删除解构 `er, ir`
- **效果**：复用 Batch 2 在 `use-panel-sync.ts` 中实现的 `scrollBothToSection`，该函数已包含 `scrollIntoView` + `bridge-highlight` 添加 + 1200ms 定时移除

### A3-2：SVG circle dot

- **操作**：
  - `BridgeItem` 接口新增 `dotCx: number` + `dotCy: number`
  - 计算：`dotCx = gapCenterX`，`dotCy = (eTop + eBot + iTop + iBot) / 4`
  - 渲染：`<circle cx cy r=3 fill={color} opacity={hover?0.85:0} transition:opacity 0.15s />`
- **对齐确认**：与 demo `dot.setAttribute('r','3'); dot.setAttribute('opacity', isHov ? 0.85 : 0)` 完全一致

### A4-1：气泡弹出位置（右侧 + 翻转）

- **操作**：`relation-hover.tsx` `onMouseOver` 中 `[data-ri]` 分支
  - 从 `left: rect.left, top: rect.bottom + 6` 改为 `left = rect.right + 8, top = rect.top - 4`
  - 翻转：`if (left + 230 > window.innerWidth - 8) left = rect.left - 238`
  - 垂直安全：`Math.max(8, Math.min(top, window.innerHeight - 190))`
- **对齐确认**：与 demo `showBub` 定位逻辑逐行一致

### A4-2：气泡消失 200ms 延迟

- **操作**：
  - 新增 `bubTimerRef` + `clearBubTimer()` + `scheduleBubHide(delayMs)`
  - `[data-ri]` mouseleave → `scheduleBubHide(200)`（demo: `setTimeout(hideBub, 200)`）
  - `.bub` mouseleave → `scheduleBubHide(150)`（demo: `setTimeout(hideBub, 150)`）
  - `.bub` mouseenter → `clearBubTimer()`
  - `[data-ri]` mouseenter → `clearBubTimer()`
  - `onDocMouseDown` → `clearBubTimer()` + `setBub(null)`
- **对齐确认**：延迟值与 demo 完全匹配

### A4-3：气泡 max-width 240px

- **操作**：
  - 移除 Tailwind `max-w-[min(360px,calc(100vw-24px))]`（覆盖了 CSS 的 240px）
  - `min-w-[200px]` → `min-w-[160px]`（对齐 demo `.bub{min-width:160px}`）
  - CSS `.bub { max-width: 240px }` 已在 Batch 1 中设置，现在生效
- **对齐确认**：与 demo `.bub{max-width:240px;min-width:160px}` 一致

## 子 Agent 使用情况

本次未使用子 Agent。改动量小（2 文件，约 30 行变更），全部由 Opus 直接完成。

## 验收确认

- `npx tsc -b --noEmit`: ✅
- `npm run build`: ✅（932KB JS + 98KB CSS）
- Linter: ✅（0 errors）
- 浏览器验证: 待人工复核（桥线 hover circle dot、点击高亮 1.2s 消退、气泡右侧弹出 + 翻转、200ms 消失延迟）

## 对齐清单打钩


| 项目                   | 状态      |
| -------------------- | ------- |
| A3-1 桥线点击高亮 1.2s     | ✅ 代码已对齐 |
| A3-2 SVG circle dot  | ✅ 代码已对齐 |
| A4-1 气泡位置右侧+翻转       | ✅ 代码已对齐 |
| A4-2 消失延迟 200ms      | ✅ 代码已对齐 |
| A4-3 max-width 240px | ✅ 代码已对齐 |
