# Demo 05-complete 行为规格

> 源文件：`public/demos/05-complete.html`（1080 行）
> 用途：主应用可视化面板开发和验收的唯一源头文档
> 创建日期：2026-04-07

---

## 1. 页面整体结构

```
body (flex column, 100vh)
├── .arch-bar          — 架构条（顶部）
├── .layout (CSS Grid: 1fr 32px 1fr)
│   ├── .panel         — 左面板（可视化编辑）
│   │   ├── .ph        — 面板 Header
│   │   └── .pb#eScr   — 面板 Body（可滚动）
│   │       ├── .sec[data-s=basic]  — 基本信息区块
│   │       ├── .sec[data-s=meta]   — 元数据区块（只读）
│   │       ├── .sec[data-s=env]    — 环境变量区块
│   │       ├── .sec[data-s=tools]  — 工具区块
│   │       ├── .sec[data-s=files]  — 文件权限区块
│   │       ├── .sec[data-s=exec]   — 脚本管道区块
│   │       └── .sec[data-s=doc]    — 文档结构区块
│   ├── .bridge-col    — 桥线列（32px 宽）
│   │   ├── .bridge-col-ph — 列头（含控制入口 + 设置浮窗）
│   │   └── .bridge-col-body
│   ├── .panel         — 右面板（源码预览）
│   │   ├── .ph        — 面板 Header
│   │   └── .pb#pScr   — 面板 Body（可滚动，7 个对应区块）
│   └── #bridgeSvg     — SVG 桥线叠加层（absolute, z-index:20）
├── .bridge-tip        — 桥线 tooltip（fixed, 跟随鼠标）
├── .bub               — 关系气泡浮窗（fixed）
├── .htip              — 实体 hover tooltip（fixed, 居中于实体下方）
├── .rel-bar           — 关系路径栏（选中实体时显示）
└── .pbar              — 底部上下文栏
```

**CSS 变量（主题配色）**：

主应用按照 demo 的纯暗色方案开发，不做 dark/light 双模式。

```
背景层级：
  --bg:      #09090b    — 页面底色
  --surface: #18181b    — 面板/卡片/bar 背景
  --border:  #27272a    — 边框

文字层级：
  --text:    #e4e4e7    — 主文字
  --muted:   #71717a    — 次要文字
  --dim:     #52525b    — 最弱文字/辅助信息

功能色（区块/架构条/关系高亮共用）：
  --blue:    #3b82f6    — 蓝（basic 区块、字段高亮、实体选中）
  --amber:   #f59e0b    — 琥珀（env 区块、实体关联态）
  --emerald: #10b981    — 绿（tools 区块）
  --teal:    #14b8a6    — 青（exec/doc 区块、桥线控制）
  --violet:  #8b5cf6    — 紫（files 区块）
  --rose:    #f43f5e    — 玫红（ops 架构层）
  --slate:   #64748b    — 灰蓝（meta 区块）
```

**浮层/弹窗底色**：统一使用 `#1c1c20`（bridge-pop、bub、htip、bridge-tip）

**半透明层级**（反复出现的固定值）：

- `rgba(255,255,255,.03)` — hover 背景（表行、卡片、字段行）
- `rgba(255,255,255,.04)` — 表格行间线
- `rgba(255,255,255,.07)` — badge 背景、区块高亮 `.sh` 背景
- `rgba(255,255,255,.15)` — 关系指示器默认文字色
- `rgba(255,255,255,.45)` — 关系指示器 hover 文字色

---

## 2. 架构条（.arch-bar）

### 结构

```
.arch-bar (flex, gap:2px, padding:7px 16px, bg:--surface, border-bottom)
├── .lbl "逻辑层:" (11px, --dim)
├── .arch-chip[data-l=identity] "🪪 身份"
├── .arch-arrow "→"
├── .arch-chip[data-l=deps] "📦 依赖"
├── .arch-arrow "→"
├── .arch-chip[data-l=caps] "⚡ 能力"
├── .arch-arrow "→"
├── .arch-chip[data-l=config] "⚙️ 配置"
├── .arch-arrow "→"
├── .arch-chip[data-l=exec] "▶️ 执行"
├── .arch-arrow "→"
└── .arch-chip[data-l=ops] "🔧 运维"
```

### 样式

- `.arch-chip`：padding:3px 9px, border-radius:14px, font-size:11px, font-weight:600, border:1px solid transparent
- 6 种 `data-l` 分色（背景 + 文字）：
  - identity: bg rgba(59,130,246,.1), color #93c5fd
  - deps: bg rgba(245,158,11,.1), color #fcd34d
  - caps: bg rgba(16,185,129,.1), color #6ee7b7
  - config: bg rgba(139,92,246,.1), color #c4b5fd
  - exec: bg rgba(20,184,166,.1), color #5eead4
  - ops: bg rgba(244,63,94,.1), color #fda4af
- `.arch-arrow`：color:--dim, font-size:10px, padding:0 1px

### 交互

- **hover**：filter:brightness(1.3)
- **点击**：toggle `.on` class（同一 chip 再点取消）
- `**.on` 态**：transform:translateY(-1px) + border-color 对应主色 + box-shadow
- **层级筛选**：选中某层后，属于该层的区块加 `.sh`（高亮），不属于的加 `.sd`（opacity:0.1, pointer-events:none）
- **层→区块映射**：identity→[basic], deps→[meta,env], caps→[tools,files], config→[], exec→[exec], ops→[doc]

---

## 3. 面板通用

### Header (.ph)

- padding:7px 14px, border-bottom:1px solid --border, font-size:12px, color:--muted, bg:--surface
- min-height:34px, flex, align-items:center, gap:6px
- `strong` 内文字 color:--text
- 左面板：`svg(12x12) + <strong>可视化编辑</strong> + <span 10px --dim>tech-news-digest-cn / SKILL.md</span>`
- 右面板：`svg(12x12) + <strong>源码预览</strong> + <span margin-left:auto 10px --dim>SKILL.md</span>`

### Body (.pb)

- flex:1, overflow-y:auto, padding:12px, scroll-behavior:smooth
- 左面板 `.pb` 追加 padding-right:6px
- 右面板 `.pb` 追加 padding-left:6px

---

## 4. 区块通用（.sec）

### 结构

```
.sec[data-s="xxx"][data-side="e|p"][data-ly="layer"]
├── .sl (标题行，clickable)
│   ├── .ca "▼" (折叠箭头，8px)
│   ├── .dt (色点，6x6 圆)
│   ├── .tt (标题文字，12px font-weight:600)
│   ├── .bg (可选 badge，10px, pill)
│   └── .ro-badge (可选，只读标记 "🔒 只读"，9px)
└── .clp (可折叠内容区)
    ├── .sh-txt (可选，来源映射说明，9px monospace --dim)
    └── 具体内容...
```

### 样式

- `.sec`：border-left:3px solid transparent, border-radius:6px, padding:9px 11px, margin-bottom:8px
- 7 种 `data-s` 对应 border-left-color：basic→--blue, meta→--slate, env→--amber, tools→--emerald, files→--violet, exec→--teal, doc→--teal
- `.sh` 态（hover/高亮）：box-shadow:inset 0 0 0 1px rgba(255,255,255,.07) + 对应色背景 rgba(x,.07)
- `.sd` 态（层级筛选 dimmed）：opacity:0.1, pointer-events:none
- `.col` 态（折叠）：`.ca` rotate(-90deg), `.clp` max-height:0 + opacity:0
- 折叠动画：`.clp` transition:max-height .25s ease, opacity .2s
- `.bg`（badge）：font-size:10px, padding:1px 5px, border-radius:10px, bg:rgba(255,255,255,.07), color:--muted
- `.sh-txt`（来源说明）：font-size:9px, --dim, monospace, padding-left:13px, margin-bottom:6px
- 只读区块：`.sec-ro` opacity:0.72, `.sec-ro .ecard` bg rgba(255,255,255,.015) + border-style:dashed

### 交互

- **hover 区块**：左右同名区块同时加 `.sh`（如果没有处于层级筛选模式）
- **点击 .ca**：toggle `.col`，280ms 后重建锚点
- **点击 .sl**（标题行）：双面板同时滚动到对应区块，高亮 1.2s 后消退

---

## 5. 左面板 — 7 个区块内容

### 5.1 基本信息（basic）

```
.ecard
├── .fr[data-field="f-name"]  → .fl "名称" + .fv "tech-news-digest-cn"
├── .fr[data-field="f-desc"]  → .fl "描述" + .fv "..."
├── .fr[data-field="f-ver"]   → .fl "版本" + .fv "3.16.0"
└── .fr[data-field="f-home"]  → .fl "主页" + .fv (蓝色链接)
```

- `.ecard`：bg --surface, border 1px --border, radius 6px, padding 8px 10px
- `.fr`：flex, gap 8px, padding 4px, font-size 12px, cursor pointer, radius 3px；hover → bg rgba(255,255,255,.03)
- `.fl`：width 38px, shrink 0, --muted, text-align right, 11px
- `.fv`：monospace, 11px, word-break break-all

### 5.2 元数据（meta，只读）

- `.sec-ro` + `.ro-badge "🔒 只读"`
- `.ecard` 内容：必需依赖（`.en[data-eid]` 标记的实体文本）+ 可选依赖
- 布局：10px monospace, padding-left 6px, line-height 1.8

### 5.3 环境变量（env）

```
table.et
├── thead: th 变量名 | th 必需 | th 描述 | th (空，关系指示器列)
└── tbody
    └── tr[data-field="f-e-xxx"]
        ├── td > .en[data-eid="XXX"] (变量名)
        ├── td "必需|可选"
        ├── td.ed (描述)
        └── td.rc > .ri[data-ri="XXX"] > .rp*
```

- `.et`：width 100%, font-size 12px, border-collapse
- `.et th`：text-align left, padding 4px 6px, bg rgba(255,255,255,.03), --muted, font-weight 500, border-bottom, 10px
- `.et td`：padding 4px 6px, border-bottom rgba(255,255,255,.04)
- `.et tbody tr`：cursor pointer, hover → bg rgba(255,255,255,.025)
- `.en`：monospace, 10px, font-weight 600
- `.ed`：color --muted
- `.rc`：width 28px, text-align right, vertical-align top, padding-top 5px
- badge 显示数量："11"

### 5.4 工具（tools）

```
.tc[data-field="f-t-xxx"]
└── div (flex, justify-content space-between)
    ├── div > .tn > .en[data-eid] + .td "— 描述"
    └── .ri[data-ri] > .rp*
```

- `.tc`：bg --surface, border 1px --border, radius 5px, padding 6px 10px, margin-bottom 4px, cursor pointer；hover → bg rgba(255,255,255,.03)
- `.tn`：monospace, 12px, font-weight 600
- `.td`：10px, --muted
- badge 显示数量："3"

### 5.5 文件权限（files）

```
.ecard
├── 📖 读取 (10px --muted)
├── div[data-field="f-fr"] (10px monospace, line-height 1.8, padding-left 6px)
│   └── .en[data-eid="config-defaults"] 等路径实体
├── ✏️ 写入 (10px --muted, margin-top 7px)
└── div[data-field="f-fw"] (同上格式)
```

### 5.6 脚本管道（exec）

```
.ecard (padding 6px 8px)
├── .pi[data-field="f-x-pipe"] — 根节点 run-pipeline.py (12px bold)
│   └── .ri[data-ri] (margin-left auto)
└── .pi-indent
    ├── .pi[data-field="f-x-rss"] "→ fetch-rss.py"
    ├── .pi[data-field="f-x-tw"]  "→ fetch-twitter.py"
    ├── ... (共 7 个子脚本)
    └── .pi[data-field="f-x-pdf"] "→ generate-pdf.py" + .ri
```

- `.pi`：flex, gap 6px, padding 3px 4px, radius 3px, cursor pointer, 11px；hover → bg rgba(255,255,255,.03)
- `.pi-indent`：padding-left 14px, color --dim
- badge 文本："执行层"

### 5.7 文档结构（doc）

```
.di[data-field="f-d-h1"] > .dh "#" + 标题文字
.di[data-field="f-d-qs"] > .dh "##" + 标题文字 (padding-left 12px)
... (共 6 项)
```

- `.di`：flex, gap 4px, 11px, padding 2px 0
- `.dh`：--dim, monospace, 9px, min-width 16px
- badge 文本："6 节"

---

## 6. 右面板 — 7 个区块内容

右面板每个区块结构与左面板对称：`.sec[data-s][data-side="p"]`，内部用 `.pc`（预览代码块）包裹。

### 预览代码通用

- `.pc`：monospace, 10px, line-height 1.65, white-space pre-wrap, word-break break-all, color #a1a1aa
- 语法高亮：`.k` key 蓝 #7dd3fc, `.s` string 绿 #86efac, `.b` bool 琥珀 #fbbf24, `.h` heading 白色 bold, `.dm` dim --dim

### 字段包装（.pf）

每个可映射的字段用 `.pf[data-field]` 包裹：

- `.pf`：display block, padding 1px 3px, radius 2px, cursor pointer
- hover → bg rgba(255,255,255,.025)
- `data-field` 值与左面板一一对应

### 实体注入

右面板预览文本中的实体名（变量名、工具名、脚本名等）用 `.en[data-eid]` 包裹，和左面板使用相同的 `data-eid` 值。

### 各区块特点

- **basic**：以 `---` 开头，4 行 key-value，每行一个 `.pf[data-field]`
- **meta**：嵌套 YAML 结构，实体名内联在字符串值中
- **env**：`env:` 开头，每个环境变量一个 `.pf[data-field]`，内含 name/required/description
- **tools**：`tools:` 开头，每个工具一个 `.pf[data-field]`
- **files**：`files:` 开头，read/write 分别一个 `.pf[data-field]`
- **exec**：markdown body `## 脚本管道`，每个 `###` 脚本一个 `.pf[data-field]`
- **doc**：markdown body 其余 headings，每个 heading 一个 `.pf[data-field]`

---

## 7. 桥线列 + SVG 桥线

### 桥线列

- `.bridge-col`：bg --bg, 32px 宽（grid 第二列）
- `.bridge-col-ph`：height 34px, border-bottom, bg --surface, flex center
- 内含 `.bridge-ctrl`（链接图标，28x28，默认 opacity 0.3）

### 桥线 SVG

- `#bridgeSvg`：absolute, top 0, left 0, 100%×100%, pointer-events none, z-index 20
- 每个区块一组 SVG 元素：`<path>` fill + `<line>` top + `<line>` bottom + `<circle>` dot
- **几何**：梯形连接——左侧 `fx0 = bridgeCol.left - EXTEND(12)`，右侧 `fx1 = bridgeCol.right + EXTEND(12)`
- 颜色与区块色一致
- fill-opacity：默认 0.03，hover 0.1，层级 dimmed 0
- line stroke-opacity：默认 0.28，hover 0.85，dimmed 0.04
- line stroke-width：默认 0.8，hover 1.5
- stroke-dasharray：高度差 > 3px 时用虚线 `4 3`，否则实线
- 中心点 dot：默认 opacity 0，hover 时 0.85

### 设置浮窗（.bridge-pop）

- 触发：hover `.bridge-col-ph` 区域
- 位置：absolute, top 32px, 水平居中, z-index 400
- 内容：
  - "面板联动" 标题（9px uppercase letter-spacing 1px）
  - "滚动同步" toggle（默认开）
  - "桥线连接" toggle（默认开）
  - 分隔线
  - `Alt + 滚动 = 临时独立滚动` 提示
- `.pop-toggle`：28×15px 滑块，`.on` 时背景 teal, 圆点滑到右侧
- 消失：mouseleave 150ms 延迟

### 桥线交互

- **hover 梯形**：fill-opacity 升高 + 左右同名区块加 `.sh` + 显示 bridge-tip（"xxx — 点击双面板跳转"）
- **点击梯形**：双面板同时 smooth scroll 到对应区块，高亮 1.2s
- **bridge-tip**：fixed, 跟随鼠标(+14px, -6px), 10px, bg #1c1c20, border #333, radius 5px

---

## 8. 字段级高亮

### 数据属性

- 左面板和右面板中的可映射元素都有 `data-field="xxx"` 属性
- 字段命名规则：`f-name`, `f-desc`, `f-ver`, `f-home`, `f-e-xxx`（env）, `f-t-xxx`（tool）, `f-fr`/`f-fw`（files read/write）, `f-x-xxx`（exec script）, `f-d-xxx`（doc heading）

### 交互

- **点击**带 `data-field` 的元素：
  - 被点击的元素所在面板：加 `.fa`（active 高亮，rgba(59,130,246,.13)）
  - 另一面板同 `data-field` 元素：加 `.fm`（mirror 高亮，rgba(59,130,246,.07) + outline 1px dashed rgba(59,130,246,.35)）
- **清除**：点击空白区域或按 Esc

---

## 9. 实体关系系统

### 实体标记

- `.en[data-eid="xxx"]`：标记一个可交互实体
- 样式：monospace 10px font-weight 600, padding 0 1px, radius 2px, transition background/opacity 0.2s
- `.en.has-rel`：该实体在关系表 R 中有记录，cursor pointer

### 关系指示器（.ri）

- 位于左面板 env/tools/exec 区块中每个实体行的末尾
- `.ri[data-ri="eid"]`：inline-flex, column, align-items flex-end
- 内含 `.rp` 子项，每项格式如 "→1"、"↔1"、"⊂2"
- `.rp`：9px, monospace, color rgba(255,255,255,.15), line-height 1.3
- `.ri:hover .rp`：color 升至 rgba(255,255,255,.45)

### 关系数据（R 对象）

关系类型：`→` 引用、`↔` 替代、`⊂` 包含

共 14 个实体有关系数据：
GITHUB_TOKEN, TWITTER_API_BACKEND, X_BEARER_TOKEN, BRAVE_API_KEYS, TAVILY_API_KEY, python3, mail, gog, run-pipeline, merge-sources, generate-pdf, sources.json, topics.json, config-defaults

### 实体点击交互

1. 点击 `.en[data-eid]` → 触发选中
2. 选中实体加 `.es`（selected：bg rgba(59,130,246,.25), color #fff）
3. 关系目标实体加 `.er`（related：bg rgba(245,158,11,.18)）
4. 其他所有实体加 `.edm`（dimmed：opacity 0.2）
5. 同时触发字段高亮（如果该实体在 `[data-field]` 内）
6. 显示关系路径栏

### 关系气泡（.bub）

- 触发：hover `.ri[data-ri]`（关系指示器）
- 位置：实体右侧 +8px（空间不足时翻到左侧 -238px）
- 内容：
  - `.bub-t`：实体名（11px monospace bold）
  - 按关系类型分组，每组一个 `.bub-g`
  - `.bub-gl`：类型符号 + 中文标签 + 数量
  - `.bub-i`：目标实体名（11px, hover → 蓝色背景）
- 样式：bg #1c1c20, border #333, radius 8px, padding 10px 12px, shadow, max-width 240px
- 消失：mouseleave 200ms 延迟；鼠标移入气泡内不消失
- 点击气泡：选中该实体（触发 selByEid）

### Hover tooltip（.htip）

- 触发：hover `.en.has-rel` 400ms 后显示
- 位置：实体中心下方 +6px，水平居中（transform translateX(-50%)）
- 内容：固定文本 "点击查看关联关系"
- 样式：bg #1c1c20, border #444, radius 5px, padding 3px 8px, 9px, --muted, pointer-events none
- 消失：mouseleave 或 click 立即隐藏
- 条件：如果已有选中实体（selEid 非 null），不显示

---

## 10. 关系路径栏（.rel-bar）

### 结构

```
.rel-bar (border-top, padding 6px 16px, bg rgba(24,24,27,.9))
├── .rel-hd
│   ├── .rel-nm (实体名，12px monospace bold)
│   └── .rel-x "✕ 清除" (10px --dim, hover → bg + --text)
└── #relRows
    └── .pr* (每条关系一行)
        ├── .pr-t (关系类型符号，monospace 11px --dim, width 14px center)
        ├── .pr-tg (目标实体名，monospace bold, --blue, min-width 110px)
        └── .pr-d (描述，10px --muted italic)
```

### 交互

- **显示条件**：选中一个有关系的实体后出现（加 `.vis`）
- **点击 .rel-x**：清除所有选中状态
- **点击 .pr-tg**：选中该目标实体（调用 selByEid）
- **hover .pr-tg → flash**：目标实体闪烁（`.en.flash` 动画 elFlash 0.6s ease 2 次）
- max-height 140px, overflow-y auto

---

## 11. 底部上下文栏（.pbar）

### 结构

```
.pbar (flex, padding 5px 16px, bg --surface, border-top, min-height 28px)
├── .pbar-sec (当前区块)
│   ├── .dot (5x5 圆，颜色跟随当前区块)
│   ├── .name (区块名，--muted, 10px bold)
│   └── .pos "(1/7)"
├── .pbar-sep "·"
├── .pbar-pct (滚动百分比)
│   ├── "左" (8px)
│   ├── .bar > .fill (40x3px 进度条，--blue)
│   ├── "0%"
│   ├── "↔"
│   ├── "右" (8px)
│   ├── .bar > .fill (40x3px 进度条，--emerald)
│   └── "0%"
├── .pbar-sep "·"
├── .pbar-alt "⚡ 独立滚动中" (--amber, 默认隐藏，Alt 按住时显示)
└── .pbar-hint "Alt+滚动 = 独立滚动" (9px --dim，Alt 按住时隐藏)
```

### 动态更新

- 当前区块：根据活动面板的 scrollTop，找到距离视口 33% 位置最近的 `.sec`
- 滚动百分比：`scrollTop / (scrollHeight - clientHeight) * 100`
- 进度条 fill width 按百分比，transition 80ms

---

## 12. 滚动同步

### 机制

- 分段线性映射：基于每个 `.sec` 的 `offsetTop` 建立左右锚点数组
- 当用户在一侧滚动时，计算对侧应该滚到的位置
- 映射函数 `mapScroll(srcAnchors, tgtAnchors, scrollTop)` 做分段线性插值

### 锚点缓存

- `rebuildAnchors()`：遍历 `.sec` 读取 `offsetTop`，构建锚点数组
- 触发重建时机：resize, 折叠/展开 transitionend
- 滚动时不重建锚点，只用缓存值

### Pointer 追踪

- `pointerenter`/`pointerleave` 追踪用户当前在哪个面板
- 只有主动面板的 scroll 会触发同步
- 两侧同时监听 scroll 事件

### Alt 独立滚动

- Alt 按住时跳过同步（altHeld = true）
- 底部栏切换到"⚡ 独立滚动中"提示
- Alt 松开后恢复同步

### rAF 合并

- 所有 scroll 事件只标记 `needSync = true`
- 由单个 `requestAnimationFrame(frame)` 批量处理：同步 → 桥线更新 → 底部栏更新
- 防止多次 scroll 触发多次 DOM 写入

---

## 13. 全局事件

### 键盘

- **Escape**：清除所有选中状态（实体 + 字段）+ 隐藏气泡 + 隐藏 tooltip
- **Alt down**：进入独立滚动模式
- **Alt up**：退出独立滚动模式

### click 委托

统一在 `document` 上监听 click，逻辑：

1. 如果点击在 arch-bar / .sl / bridgeSvg / pbar / rel-bar / .ri 内 → 忽略（这些有自己的 handler）
2. 如果点击在 `.bub` 内 → 选中气泡关联的实体
3. 如果点击了 `[data-eid]` 或 `[data-field]` → 清除旧选中，触发新的字段高亮 + 实体关系高亮
4. 否则 → 清除所有选中状态

### resize

- 重建锚点 + 触发一帧更新

---

## 14. data-field 完整映射表


| 左面板 data-field | 区块    | 对应内容                | 右面板 data-field |
| -------------- | ----- | ------------------- | -------------- |
| f-name         | basic | 名称                  | f-name         |
| f-desc         | basic | 描述                  | f-desc         |
| f-ver          | basic | 版本                  | f-ver          |
| f-home         | basic | 主页                  | f-home         |
| f-e-tab        | env   | TWITTER_API_BACKEND | f-e-tab        |
| f-e-xbt        | env   | X_BEARER_TOKEN      | f-e-xbt        |
| f-e-ght        | env   | GITHUB_TOKEN        | f-e-ght        |
| f-e-bak        | env   | BRAVE_API_KEYS      | f-e-bak        |
| f-e-tak        | env   | TAVILY_API_KEY      | f-e-tak        |
| f-t-py         | tools | python3             | f-t-py         |
| f-t-mail       | tools | mail                | f-t-mail       |
| f-t-gog        | tools | gog                 | f-t-gog        |
| f-fr           | files | read 路径列表           | f-fr           |
| f-fw           | files | write 路径列表          | f-fw           |
| f-x-pipe       | exec  | run-pipeline.py     | —              |
| f-x-rss        | exec  | fetch-rss.py        | f-x-rss        |
| f-x-tw         | exec  | fetch-twitter.py    | f-x-tw         |
| f-x-web        | exec  | fetch-web.py        | f-x-web        |
| f-x-gh         | exec  | fetch-github.py     | f-x-gh         |
| f-x-rd         | exec  | fetch-reddit.py     | f-x-rd         |
| f-x-merge      | exec  | merge-sources.py    | f-x-merge      |
| f-x-pdf        | exec  | generate-pdf.py     | f-x-pdf        |
| f-d-h1         | doc   | # 标题                | f-d-h1         |
| f-d-qs         | doc   | ## 快速开始             | f-d-qs         |
| f-d-ds         | doc   | ## 数据源架构            | f-d-ds         |
| f-d-pp         | doc   | ## 脚本管道             | f-d-pp         |
| f-d-out        | doc   | ## 输出格式             | f-d-out        |
| f-d-cfg        | doc   | ## 配置说明             | f-d-cfg        |


---

## 15. data-eid 完整实体表


| data-eid            | 出现位置                         | 有关系数据                         |
| ------------------- | ---------------------------- | ----------------------------- |
| python3             | meta(必需依赖), tools            | ✅ →run-pipeline               |
| mail                | meta(可选), tools              | ✅ ↔gog                        |
| gog                 | meta(可选), tools              | ✅ ↔mail                       |
| gh                  | meta(可选)                     | —                             |
| weasyprint          | meta(可选), exec(generate-pdf) | —                             |
| TWITTER_API_BACKEND | env                          | ✅ →fetch-twitter              |
| X_BEARER_TOKEN      | env                          | ✅ →fetch-twitter              |
| GITHUB_TOKEN        | env                          | ✅ →fetch-github, ↔gh          |
| BRAVE_API_KEYS      | env                          | ✅ →fetch-web, ↔TAVILY         |
| TAVILY_API_KEY      | env                          | ✅ →fetch-web, ↔BRAVE          |
| run-pipeline        | exec                         | ✅ →6个子脚本                      |
| fetch-rss           | exec                         | —                             |
| fetch-twitter       | exec                         | —                             |
| fetch-web           | exec                         | —                             |
| fetch-github        | exec                         | —                             |
| fetch-reddit        | exec                         | —                             |
| merge-sources       | exec                         | ✅ →topics.json, →tmp          |
| generate-pdf        | exec                         | ✅ →weasyprint, →references    |
| config-defaults     | files(read)                  | ✅ ⊂sources.json, ⊂topics.json |
| references-dir      | files(read)                  | —                             |
| scripts-dir         | files(read)                  | —                             |
| sources.json        | doc(配置说明)                    | ✅ →3个fetch脚本                  |
| topics.json         | doc(配置说明), exec(merge)       | ✅ →fetch-web, →merge          |


