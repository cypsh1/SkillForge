# Demo 05-complete 对齐清单（重构版）

> 源头规格：`project-harness/evidence/demo-05-behavior-spec.md`
> 对比对象：主应用当前实现（working tree，2026-04-07）
> 重构日期：2026-04-07
> 基于 review 改进：补反向差异 / 按 A/B/C 分层 / 显式化判定依据

---

## 分类说明

| 类别 | 含义 | 修复策略 |
|---|---|---|
| **A 类** | 用户可见的行为 / 视觉差异，demo 有、主应用没有或不一致 | 必须对齐，按批次处理 |
| **B 类** | 功能契约差异（字段命名、映射规则等），影响左右面板联动正确性 | 需要明确决策：改代码 or 更新规格 |
| **C 类** | 内部实现 / DOM 约定差异，用户不直接感知，功能等价 | 低优先级，可选修复 |
| **D 类** | 有意差异，不需要对齐 | 记录即可 |
| **P 类** | 待产品决策项，双方方案都成立 | 先确认取舍，再决定是否进入修复批次 |

---

## D 类：有意差异（不需要对齐）

| # | 差异 | 说明 |
|---|---|---|
| D1 | 布局机制 | Demo CSS Grid `1fr 32px 1fr` → 主应用 react-resizable-panels（可拖拽三栏） |
| D2 | 导航面板 | Demo 无 → 主应用有左侧 NavigatorPanel |
| D3 | 数据来源 | Demo hardcode 单个 skill → 主应用动态多 skill |
| D4 | basic 区块增量编辑入口 | 主应用在 basic 区块底部增加“编辑全部字段”按钮，用于展开结构化 FrontmatterForm |
| D5 | Inspector 头部文件操作 | 主应用增加“导出”按钮与“已修改”状态 Badge，属于产品化文件操作能力 |
| D6 | Tauri 保存能力 | 主应用在桌面端增加“保存”按钮，属于运行环境相关增量能力 |

## A 类：用户可见的行为 / 视觉差异

### A1 主题系统（影响面最广）

**判定依据**：Demo 规格 §1 明确指定 hardcode hex 色值体系，主应用仍是 shadcn oklch 双模式，色值在视觉上可测量差异显著（约 20-30% 亮度偏差）。

| # | 项目 | Demo 规格 | 主应用现状 | 需运行时确认 |
|---|---|---|---|---|
| A1-1 | 配色方案 | 纯暗色，hardcode hex | shadcn oklch，light/dark 双模式 | 否 |
| A1-2 | 页面底色 | `#09090b` | dark: `oklch(0.145)` ≈ `#252525`，差距可见 | 否 |
| A1-3 | 面板/卡片背景 | `#18181b` | dark: `oklch(0.205)` ≈ `#343434`，差距可见 | 否 |
| A1-4 | 边框色 | `#27272a` | `oklch(1 0 0 / 10%)` = 动态值 | 否 |
| A1-5 | `--dim` 变量缺失 | `#52525b`（比 `--muted` 更暗） | 无此变量，统一用 `--muted-foreground`(≈`#b3b3b3`)，偏亮约 25% | 否 |
| A1-6 | 浮层底色 | 统一 `#1c1c20`（bridge-pop/bub/htip） | 各用 shadcn token，色值不一致 | 否 |

> **注意**：`.pc .dm` 用了 `--muted-foreground` + `opacity:0.6`，经 opacity 压暗后视觉接近 `--dim`，判定为 ✅ 已对齐。`.dh`、`.pi-indent`、`.arch-label` 等无 opacity 补偿，与 `--dim` 偏差可见，判定为未对齐。这是口径不同的来源，非随机。

### A2 区块交互行为

| # | 项目 | Demo 规格 | 主应用现状 | 需运行时确认 |
|---|---|---|---|---|
| A2-1 | 标题行点击：双面板跳转 | 点击 `.sl` → 双面板同时 scroll 到对应区块 + 高亮 1.2s | 点击整个 header → 仅本地 toggle 折叠 | 否 |
| A2-2 | 折叠箭头与标题行功能分离 | `.ca`（箭头）触发折叠，`.sl`（整行）触发跳转 | 整行点击只触发折叠，无分离 | 否 |
| A2-3 | 折叠动画 | `.clp { transition: max-height .25s ease, opacity .2s }` | `bridge-section-content` 无 transition 定义，折叠瞬间完成 | 是（需确认是否肉眼可感知） |
| A2-4 | hover 高亮 `.sh` | `box-shadow: inset 0 0 0 1px rgba(255,255,255,.07)` + 对应色背景 | `bridge-highlight` 仅设 bg，缺 box-shadow | 是（需确认在暗色背景上是否可见） |

### A3 桥线交互

| # | 项目 | Demo 规格 | 主应用现状 | 需运行时确认 |
|---|---|---|---|---|
| A3-1 | 点击梯形 → 高亮 1.2s | 双面板跳转 + 区块临时高亮 1.2s 后消退 | 仅 scrollBothTo()，无高亮动画 | 否 |
| A3-2 | SVG circle dot | 每个区块中心点有 `<circle>`，hover 时 opacity:0.85 | 未渲染 circle 元素 | 是（需确认在视觉上是否显著） |

### A4 关系气泡

| # | 项目 | Demo 规格 | 主应用现状 | 需运行时确认 |
|---|---|---|---|---|
| A4-1 | 弹出位置 | 实体右侧 +8px，空间不足时翻到左侧 -238px | 关系指示器正下方 +6px，无翻转逻辑 | 否（右侧 vs 下方是明显方向差异） |
| A4-2 | 消失延迟 | mouseleave 后 200ms 延迟（移入气泡内不消失） | 无显式 200ms 延迟 setTimeout | 是（需确认快速划过时是否影响体验） |
| A4-3 | max-width | 240px | `min(360px, calc(100vw-24px))`，过宽 | 是（需确认内容长度是否会撑到差异） |

### A5 上下文栏 / 底部细节

| # | 项目 | Demo 规格 | 主应用现状 | 需运行时确认 |
|---|---|---|---|---|
| A5-1 | 上下文栏区块名颜色 | `--muted` | `text-foreground/90`，偏亮 | 否 |

---

## B 类：功能契约差异（需决策）

### B1 exec 脚本管道字段前缀

**背景**：左面板脚本管道区块和右面板预览区块用字段标识符来实现"点击某个脚本，对侧镜像高亮"。左右两侧必须使用**完全相同**的标识符，联动才能工作。

| 项目 | Demo 规格 | 主应用现状 |
|---|---|---|
| exec 字段前缀 | `f-x-*`（如 `f-x-rss`、`f-x-pipe`） | `f-s-*`（如 `f-s-fetch-rss`、`f-s-run-pipeline`） |

**当前影响**：主应用左右两侧都一致地用了 `f-s-*`，所以镜像高亮功能**本身是正常工作**的，用户体验无差别。差异仅在命名惯例与规格不一致。

**决策**：按"从 demo 出发"原则，建议改为 `f-x-*`。改动范围至少 3 处：`editor-panel.tsx` 1 处（左面板脚本区块 fieldKey 生成），`inspector-panel.tsx` 2 处（右面板 exec 区块包装字段 + exec 实体注入规则）。改后规格文档与代码完全一致，减少未来维护认知负担。

> ⚠️ 注意：`f-x-*` 前缀下 demo 用的是短缩写（`f-x-rss` 而非 `f-x-fetch-rss`），主应用用的是完整脚本名。这一点属于 **D3**（动态数据 vs hardcode），不强制对齐短缩写。

---

## C 类：内部实现 / DOM 约定差异（低优先级）

这些差异用户不直接感知，功能等价。不列入修复批次，保留作参考。

| # | 项目 | Demo | 主应用 | 备注 |
|---|---|---|---|---|
| C1 | 区块属性名 | `data-s="basic"` | `data-bridge-section="basic"` | 当前所有 JS 逻辑只依赖后者，改名无收益 |
| C2 | `data-side` 属性 | `data-side="e\|p"` | 未设置 | Demo 里未被 JS 逻辑使用，主应用通过独立容器 ref 区分面板，功能等价 |
| C3 | `data-ly` 属性 | `data-ly="layer"` | 未设置 | JS 通过 `isSectionDimmed()` 实现层级筛选，功能等价 |
| C4 | body `scroll-behavior` | smooth | 未设置 | 需运行时确认：点击标题行跳转时是否有体感差异（A2-1 修复后自动验证） |
| C5 | tooltip 偏移 | `+14px` | `+12px` | 2px 差异，需运行时确认是否察觉 |
| C6 | tooltip 文案 | "xxx — 点击**双面板**跳转" | "xxx — 点击跳转" | 文案略短，可一并修复（极低成本） |
| C7 | `.fr:hover` 背景 | `rgba(255,255,255,.03)` | `color-mix(in oklch, ...)` | 需运行时确认视觉是否等价 |
| C8 | `.pf:hover` 背景 | `rgba(255,255,255,.025)` | `color-mix(in oklch, ...)` | 同上 |
| C9 | `bub-i` 字号 | 11px | 10px | 需运行时确认是否察觉 |
| C10 | 折叠 transitionend 锚点重建 | 折叠动画结束后 280ms 重建锚点 | 无此监听，靠 ResizeObserver 间接触发 | 极边缘情况（仅影响折叠动画期间快速滚动） |
| C11 | Bridge-pop / bub / htip 背景 | hardcode `#1c1c20`、`#333` | shadcn token | A1 主题修复时统一处理 |
| C12 | Header bg 显式设置 | `bg: --surface` | 未显式设置（继承父容器） | 若 A1 主题修复后色值对齐，此项自动解决 |

---

## P 类：待产品决策项

| # | 项目 | Demo 方案 | 主应用方案 | 建议 |
|---|---|---|---|---|
| P1 | 左进度条颜色 | 固定 `--blue`，强调“左右面板进度对照” | 跟随当前区块色，强调“当前上下文归属” | 两种方案都成立，先在浏览器里做一次对比，再决定是否纳入修复批次 |

---

## 已对齐项摘要（高置信度，不需要变动）

以下功能模块经过静态代码审查，判定已正确实现，除非运行时出现异常否则无需再触碰。

| 模块 | 已对齐的核心项 |
|---|---|
| 架构条 | 6 种 chip 颜色、hover brightness、.on 态、层→区块映射 |
| 区块通用结构 | border-left 7 色、折叠箭头、色点、badge、只读标记、dimmed opacity |
| basic 区块 | .ecard / .fr / .fl / .fv 样式，4 个 data-field |
| env 区块 | .et 表格、4 列、行 hover、.rc/.ri 关系列 |
| tools 区块 | .tc / .tn / .td，data-field，RelationIndicator |
| files 区块 | .ecard、read/write 标签、路径 EidText 注入、f-fr/f-fw |
| exec 区块 | .pi / .pi-indent、根节点粗体、ml-auto 指示器（前缀待 B1 决策） |
| doc 区块 | .di / .dh、缩进、data-field |
| 右面板预览 | .pc 样式、5 种语法高亮、.pf 包装、7 段分割逻辑、实体注入 |
| 字段高亮 | .fa / .fm 样式和触发逻辑、Esc 清除 |
| 实体关系 | .en / .has-rel / .eid-selected / .eid-related / .eid-dimmed |
| 关系指示器 | .ri / .rp 样式、hover 变色 |
| 关系路径栏 | 全宽底部栏、.rel-nm / .rel-target / .rel-desc、flash 动画、max-height |
| 上下文栏 | dot 颜色、位置计数、双进度条、Alt 独立滚动提示 |
| 滚动同步 | 分段线性映射、锚点缓存、pointer 追踪、rAF 合并 |
| 设置浮窗 | 触发/消失延迟、两个 toggle、teal 色、Alt 提示 |
| 全局事件 | Esc 清除、Alt down/up、click 委托、resize 重建 |
| 桥线 SVG | opacity/dasharray/stroke-width 规则、hover highlight |

---

## 修复优先级路线图

### Batch 1：主题系统（A1 全部）
涉及：`src/index.css` 的色值体系替换
- 新建 `--dim` CSS 变量
- dark 模式 `--background`/`--card`/`--border`/`--muted-foreground` 对齐 demo hex
- 统一浮层底色
- 评估是否去除 light 模式（或冻结不使用）

### Batch 2：区块交互（A2）
涉及：`editor-panel.tsx` / `inspector-panel.tsx`
- 标题行点击拆分：箭头=折叠，标题=跳转+高亮
- 补折叠 CSS transition
- 补 hover `.sh` 的 inset box-shadow

### Batch 3：桥线 + 气泡（A3 + A4）
涉及：`bridge-connector.tsx` / `relation-hover.tsx`
- 桥线点击后区块 1.2s 高亮动画
- 气泡位置改为右侧 + 翻转逻辑
- 气泡消失 200ms 延迟

### Batch 4：B 类决策执行
- B1：exec 字段前缀 `f-s-*` → `f-x-*`（建议执行）
- D4-D6：作为主应用增量能力保留，不计入未对齐

### Batch 5：运行时确认项 + 产品决策
- C 类中需运行时确认的项在浏览器里逐一验证后决定是否修复
- P1：左进度条颜色做一次并排对比，再决定保留 demo 固定蓝还是主应用随区块色

---

## 计数（重构后）

| 类别 | 项数 |
|---|---|
| A 类（必须对齐） | 16 项 |
| B 类（需决策） | 1 项 |
| C 类（低优先级） | 12 项 |
| D 类（有意差异） | 6 项 |
| P 类（待产品决策） | 1 项 |
| 已对齐（不需变动） | 103 项 |

> 原版“35 项未对齐”中，真正应该排入修复批次的是 A 类 16 项（A1×6 + A2×4 + A3×2 + A4×3 + A5×1）；B 类 1 项需要先做契约决策；C 类 12 项属于低优先级实现差异；P 类 1 项属于产品偏好选择。数字本身没有意义，按 A/B/C/P 分层处理才是正确的使用方式。
