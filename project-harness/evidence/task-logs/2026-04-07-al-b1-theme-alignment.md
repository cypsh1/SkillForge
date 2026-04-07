# AL-B1 主题系统对齐 执行记录

**日期**: 2026-04-07
**执行模式**: Opus 直接编写（CSS 主题变更涉及全局影响评估，不适合委派）

## 调研记录

纯样式对齐任务，基准为已有的 `demo-05-behavior-spec.md` §1 色值表 + `demo-05-alignment-checklist.md` A1 小节。无需外部调研。

豁免原因：对齐修复，不涉及新技术选型或新交互模式。

## 批次执行

### 步骤 1：更新 `.dark` CSS 变量（A1-1 ~ A1-4）
- 操作：将 `.dark` 中全部 oklch 色值替换为 demo zinc hex 体系
  - `--background: #09090b` (zinc-950)
  - `--foreground: #e4e4e7` (zinc-200)
  - `--card: #18181b` (zinc-900)
  - `--popover: #1c1c20` (浮层专用)
  - `--muted-foreground: #71717a` (zinc-500)
  - `--border: #27272a` (zinc-800)
  - `--input: #27272a`
  - 附带对齐 `--secondary/--muted/--accent/--ring` 等辅助变量
- 结果：色值体系从 oklch 动态值完全切换为 hardcode hex

### 步骤 2：新建 `--dim` 变量（A1-5）
- 操作：
  - `.dark` 新增 `--dim: #52525b` (zinc-600)
  - `:root` 新增 `--dim: oklch(0.556 0 0)` (light fallback)
  - `@theme inline` 新增 `--color-dim: var(--dim)` 启用 `text-dim` Tailwind 工具类
  - 替换 4 处 CSS 规则：`.arch-label`/`.arch-arrow`/`.dh`/`.pi-indent` 从 `var(--muted-foreground)` 改为 `var(--dim)`
  - 替换 7 处 `editor-panel.tsx` 的 sh-txt 元素：`text-muted-foreground` → `text-dim`
- 结果：最弱文字/辅助信息有独立的层级，不再与次要文字混用

### 步骤 3：统一浮层底色（A1-6）
- 操作：
  - `.bub`：`background: #1c1c20`, `border: 1px solid #333`, `max-width: 240px`
  - `.htip`：`background: #1c1c20`, `border: 1px solid #444`
  - bridge-pop (bridge-connector.tsx)：内联样式 `background: #1c1c20`, `border: 1px solid #333`
  - bridge-tip (bridge-connector.tsx)：内联样式同上
  - 移除所有 `color-mix(in oklch, ...)` 浮层背景
- 结果：四种浮层底色统一为 `#1c1c20`

### 步骤 4：冻结 light 模式（A1-1 延伸）
- 操作：
  - `index.html`：`<html>` 添加 `class="dark"`（React 挂载前即生效）
  - `use-theme.ts`：简化为 dark-only stub，保留接口兼容
  - `app-header.tsx`：移除 `useTheme` 导入和 Sun/Moon 切换按钮
  - `app-header.tsx`：添加 `style={{ background: 'var(--card)' }}` 显式 header 背景
- 结果：应用始终在暗色模式下运行，无主题切换入口

### 步骤 5：A5-1 上下文栏区块名颜色（附带修复）
- 操作：`context-bar.tsx` 区块名 `text-foreground/90` → `text-muted-foreground font-bold`
- 结果：与 demo 的 `--muted, 10px bold` 对齐

### 步骤 6：附带清理
- `rel-bar` 背景从 `color-mix(in oklch, var(--card) 92%, transparent)` 改为 `rgba(24,24,27,.9)`
- `.bub-i:hover` 背景从 `color-mix` 改为 `rgba(59,130,246,.12)`

## 子 Agent 使用情况

| 任务 | 模型 | 质量 | 备注 |
|---|---|---|---|
| 无 | — | — | 本次全部由 Opus 直接编写，原因：CSS 主题变量影响面极广，需要全局视角评估每个变量对 103 个已对齐项的连锁影响 |

## 验收确认
- `npx tsc -b --noEmit`: ✅
- `npm run build`: ✅（931KB JS + 97KB CSS）
- 浏览器验证: ✅（暗色主题生效，色值对齐 demo zinc 体系）
- Linter: ✅（零错误）

## 逐项清单验收

| # | 项目 | 结果 |
|---|---|---|
| A1-1 | 纯暗色 hardcode hex | ✅ oklch → zinc hex，冻结 light |
| A1-2 | 页面底色 `#09090b` | ✅ |
| A1-3 | 面板/卡片 `#18181b` | ✅ |
| A1-4 | 边框色 `#27272a` | ✅ |
| A1-5 | `--dim: #52525b` | ✅ 变量 + 11 处使用点替换 |
| A1-6 | 浮层 `#1c1c20` | ✅ bub/htip/bridge-pop/bridge-tip |
| A5-1 | 上下文栏名 | ✅ 附带修复 |
