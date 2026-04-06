# D5: Demo 05-complete 全页面视觉对齐 执行记录

**日期**: 2026-04-06
**执行模式**: Opus 规划/审查 + 直接编写（本任务未委派子 Agent，因为涉及大量跨文件精细 CSS/结构修改，需要整体视角）

## 调研记录

### 搜索内容

- 无新搜索。本任务属于**已有方案的精细对齐**，参照物是 `public/demos/05-complete.html`，不涉及新技术选型或新交互模式。
- 豁免原因：纯样式/结构微调 + 对照已有 Demo 文件。

### 前置审计评估

- 评估前次对话 [D5审计报告](de35e5a5-6e6f-4b24-b294-9830861e04ce) 的分析结论
- **发现 2 处事实性错误**：header gap/padding 实际已匹配（审计误判为不一致）；section block 差距被高估
- **发现 3 处遗漏**：Inspector `.pf` 字段包装；布局架构差异（Demo 固定 32px bridge vs. app react-resizable-panels 4px）；主题双模风险
- **制定 7 条风险清单**，形成 4 批次执行策略

## 风险清单（执行前制定）

1. **布局架构差异**：不改 `BRIDGE_GUTTER_EXTEND`（25 是 react-resizable-panels 的正确值）
2. **主题双模**：不替换 oklch token 为 Demo 的 hardcode hex
3. **Entity 类名级联**：保持 `eid-selected` / `eid-related` / `eid-dimmed`，不改为 Demo 的 `es/er/edim`
4. **功能回归**：保留"编辑全部字段"等 App 专有功能
5. **Inspector .pf 包装**：评估后标记为低优先级，当前 Inspector 内容为纯文本渲染，不需要字段级交互
6. **Pipeline 树结构**：用 `.pi` + `.pi-indent` 近似 Demo 的缩进树，不引入复杂 Markdown AST 解析
7. **批次粒度**：控制每批次 ≤6 个文件修改，避免 22 区域一次全改

## 批次执行

### B1: CSS-only 安全修复

- 操作：修改 `index.css` + `architecture-bar.tsx` + `context-bar.tsx`
  - Architecture bar: padding 7→16px, chip 分 6 色（identity=蓝, deps=琥珀, capabilities=绿, config=紫, exec=红, ops=青灰）
  - Entity highlights: selected→蓝底白字, related→琥珀底, dimmed→opacity 0.2
  - `[data-field]` 过渡 + flash 动画 0.6s×2
  - Context bar: dot 5px, font-mono 9px, bar h-3px
- 结果：编译 + 构建通过
- 验证：`npx tsc -b --noEmit` ✅, `npm run build` ✅

### B2: Editor 组件结构

- 操作：修改 `editor-panel.tsx` + `index.css`
  - Env 表：关系列移到最后, "是/否" → "必需/可选"
  - Tools：Card → 紧凑 `.tc .tn .td`
  - Files：list-disc → `.ecard` + monospace
  - Doc：去字符数 + `.di .dh` 11/9px
  - Exec：扁平 → `.pi` + `.pi-indent` pipeline 树
  - Meta：list → `.ecard` + 分段文本
- 结果：编译 + 构建通过
- 验证：`npx tsc -b --noEmit` ✅, `npm run build` ✅

### B3: Inspector + 外围

- 操作：修改 `inspector-panel.tsx` + `relation-bar.tsx` + `App.tsx` + `editor-panel.tsx` + `index.css`
  - Inspector 滚动层：去 `rounded-md border bg-muted/30`
  - Relation bar：居中浮卡 → 全宽底部栏 (`.rel-bar`)
  - Relation indicator：单行计数 → `.ri > .rp`* 竖向堆叠
- 结果：修复 1 个 TS 错误（unused import）后通过
- 验证：`npx tsc -b --noEmit` ✅, `npm run build` ✅

### B4: 精修验证

- 操作：修改 `editor-panel.tsx` + `inspector-panel.tsx` + `bridge-connector.tsx` + `relation-hover.tsx` + `index.css`
  - Header 字号：icon size-3, 标题 text-xs, 副文 text-[10px]
  - Bridge tooltip：text-[10px], rounded-[5px]
  - `.pc` 预览容器 + syntax class 映射
  - `.htip` 居中 + pointer-events:none
- 结果：编译 + 构建通过
- 验证：`npx tsc -b --noEmit` ✅, `npm run build` ✅, 浏览器截图 ✅

## 浏览器验证结果

### 视觉对齐

- 架构条 6 色分层：✅ 与 Demo 一致
- Layer dim 效果（点击"依赖"后非 deps 区块淡化）：✅
- 环境变量表列序（变量名 → 描述 → 必需 → 关系）：✅
- 紧凑工具卡：✅
- 文件权限 ecard：✅
- Inspector 无多余 border/bg：✅
- Context bar dot/font/bar 细节：✅
- Header 字号 12/10px：✅

### 交互功能

- 关系点击：点击 TWITTER_API_BACKEND → 蓝底高亮（eid-selected）+ 其余实体 dimmed ✅
- Relation bar 底部栏：全宽显示，含实体名 + "→ fetch-twitter.py" + 描述 + "✕ 清除" ✅
- Inspector 联动高亮：右侧面板对应 entity 同步高亮 ✅
- 清除功能："✕ 清除"按钮点击后 relation bar 消失，所有实体恢复正常 ✅

### 代码审查验证（浏览器自动化无法触发 hover）

- htip 居中定位：`left: rect.left + rect.width/2` + `transform: translateX(-50%)` — 标准 CSS 居中模式 ✅
- htip pointer-events: none — 不拦截鼠标 ✅
- bridge tooltip：`text-[10px]` + `rounded-[5px]` + `text-muted-foreground` ✅

### 已知遗留差异（非本次任务范围）

- Inspector 内 `.pf` 字段级包装：需重构 HTML 生成逻辑，标记为未来优化项
- Demo 显示 3 工具 vs App 显示 5 工具：数据差异，非样式问题
- Bridge 连接线宽度（Demo 32px 固定列 vs App react-resizable-panels）：架构差异，刻意保留

## 子 Agent 使用情况


| 任务           | 模型  | 质量  | 备注                       |
| ------------ | --- | --- | ------------------------ |
| 本次未使用子 Agent | —   | —   | CSS/结构精细对齐需要整体视角，不适合拆分委派 |


## 验收确认

- `npm run dev`: ✅
- `npm run build`: ✅
- `npx tsc -b --noEmit`: ✅
- 浏览器验证: ✅ 主要视觉元素均与 Demo 对齐

## 修改文件清单


| 文件                                              | 修改类型                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/index.css`                                 | 新增/修改大量组件样式（arch-bar色、entity高亮、env表、tool卡、doc结构、pipeline、relation-bar、htip、.pc） |
| `src/components/workspace/architecture-bar.tsx` | `data-layer` → `data-l`                                                         |
| `src/components/workspace/context-bar.tsx`      | dot/font/bar 尺寸微调                                                               |
| `src/components/workspace/editor-panel.tsx`     | 6 个 section 结构重写（env表、tools、files、doc、exec、meta）+ header + relation indicator   |
| `src/components/workspace/inspector-panel.tsx`  | 去掉滚动层样式 + header 字号 + .pc 预览容器                                                  |
| `src/components/workspace/bridge-connector.tsx` | tooltip 字号/圆角                                                                   |
| `src/components/workspace/relation-hover.tsx`   | htip 居中定位                                                                       |
| `src/components/workspace/relation-bar.tsx`     | 浮卡→底部栏 + 去 unused import                                                        |
| `src/App.tsx`                                   | RelationBar 位置从绝对定位→文档流                                                         |
