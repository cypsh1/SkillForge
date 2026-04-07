# Batch 5 运行时确认+产品决策 执行记录

**日期**: 2026-04-07
**执行模式**: Opus 直接执行（无需委派，验证+决策任务）

## 调研记录

纯运行时验证任务，无需外部调研。决策依据来自代码审查 + 浏览器视觉对比。

## 批次执行

### 步骤 1：C 类运行时验证

逐项审查代码并在浏览器中验证：

| 项 | 代码审查结论 | 浏览器验证 | 决定 |
|---|---|---|---|
| C4 scroll-behavior | `scrollIntoView({ behavior: "smooth" })` 已设置 | 平滑滚动可感知 | 不修（功能等价） |
| C5 tooltip +14 vs +12 | `e.clientX + 12` | 2px 差异不可察觉 | 不修 |
| C6 tooltip 文案 | `"点击跳转"` 缺"双面板" | — | **已修复** |
| C7 .fr:hover | `color-mix(in oklch, var(--foreground) 3%, transparent)` | 暗色主题下 foreground≈白色 → ≈rgba(255,255,255,.03) | 不修（功能等价） |
| C8 .pf:hover | `color-mix(in oklch, var(--foreground) 2.5%, transparent)` | 同上 | 不修（功能等价） |
| C9 bub-i 字号 | `font-size: 10px`（demo 11px） | 气泡临时弹出，1px 不可察觉 | 不修 |

### 步骤 2：P1 产品决策 — 左进度条颜色

**Demo 方案**：固定 `var(--blue)` (#3b82f6)
- 优点：左蓝/右绿固定配对，强调左右面板对照
- 适用场景：demo 只有两栏简单布局

**主应用方案**：跟随当前区块色 (`meta?.color`)
- 优点：与底部上下文栏色点、区块名、架构条形成视觉一致
- 优点：传达当前上下文归属信息，信息密度更高
- 适用场景：三栏布局 + 架构条 + 导航面板的复杂 UI

**决定**：保留主应用的区块跟随色。

### 步骤 3：Batch 1-4 回归验证

| 验证项 | 结果 |
|---|---|
| Batch 1 主题 | ✅ 暗色主题视觉正确 |
| Batch 2 区块交互 | ✅ 标题点击触发双面板跳转（测试"脚本管道"） |
| Batch 3 桥线+气泡 | ✅ scrollBothToSection 正常工作 |
| Batch 4 exec 前缀 | ✅ 零 `f-s-` 残留 |

### 步骤 4：代码修改

仅 1 处：
- `bridge-connector.tsx`: `"点击跳转"` → `"点击双面板跳转"`

## 子 Agent 使用情况

无（本任务为验证+决策，无需委派）

## 验收确认

- `npx tsc -b --noEmit`: ✅
- `npm run build`: ✅
- 浏览器验证: ✅ 双面板跳转、暗色主题、区块交互均正常
- 对齐清单 Batch 5 已标记完成
