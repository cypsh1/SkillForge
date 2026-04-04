# Demo 交互方案验证与优化 执行记录

**日期**: 2026-04-05
**执行模式**: Opus 直接设计/编码（demo 原型，不适合委派）
**关联对话**: 前序对话 [Demo改进系列](7b83caac-cd76-4dcc-9cc3-57126d1eb8a8) 产出 01-03 三个 demo

## 调研记录

本次为纯交互优化迭代，基于前序对话的调研结论（VS Code Split Diff、Tiptap Split View、DatoCMS ContentLink 等）继续落地。新增参考：
- Git diff split view 的桥线连接器模式（Beyond Compare、VS Code Merge Editor）
- 分段线性映射滚动同步算法（diff 工具通用方案）

## 时间线

### Demo 04 创建：面板对齐方案（桥线 + 滚动同步）

**起因**：03-fusion.html 中两面板对应区块高度不一致，视觉对应关系弱

**方案设计**（Opus 直出，未委派）：
- 方案 A：等高 + 空白填充 — 简单但显空洞
- 方案 B：SVG 桥线连接器 — Git diff 经典方案，视觉效果最强
- 方案 C：全幅横向分隔线 — 最简但只解决"行感知"
- **选定 B+C 组合**

**实现**：
1. 三栏布局重构：左面板 | 桥线列(32px) | 右面板
2. SVG 叠加层绘制梯形桥线（颜色编码一致）
3. 桥线交互：hover 高亮 + tooltip + 点击双面板跳转
4. 区块级滚动同步 v1（syncLock 方案）

### 滚动同步 Bug 修复：反向滚动问题

**问题**：首次滚动方向正确，后续滚动方向反向
**根因**：`scrollTo({ smooth })` 产生的 scroll 事件在 `syncLock`(650ms) 释放后仍在触发 → 反向同步 → 两面板交替拉扯
**修复**：用 `pointerenter/pointerleave` 追踪用户实际操作面板，只有 `userPanel` 所在面板的 scroll 才触发同步

### 滚动同步重构：分段线性映射

**起因**：区块跳转式同步体验不连续，用户期望"同方向、同节奏"的联动
**方案讨论**：
- 用户提出核心需求：区块边界到达视口边缘的时刻两侧同步
- 讨论锚点方案：A(top+bottom 锚点) vs B(只用 top) — 选 B，更简洁
- 讨论 gap 处理：gap 被吸收进区块段，8px 差异不可感知

**实现**：
1. `buildAnchors(scr)` 构建 N+1 锚点（每个区块 top + 末区块 bottom）
2. `mapScroll(src, tgt, scrollTop)` 分段线性插值
3. 即时 `scrollTop =` 赋值（非 smooth）实现帧级同步
4. pointer 追踪消除反馈环

### 性能优化：消除滚动延迟

**问题**：联动滚动有感知延迟
**根因分析**：
1. `buildAnchors` 每帧查 DOM（offsetTop × 14）
2. `drawBridge` 每帧 `innerHTML` 重建 SVG + 重绑事件
3. 读写交错引发强制重排

**优化（三项）**：
1. **锚点缓存**：只在 init/resize/fold 时 buildAnchors，滚动帧零 DOM 读
2. **SVG 持久化**：`initBridge()` 创建一次元素 + 绑事件，`updateBridgePositions()` 只改属性
3. **单帧合并**：scroll 事件只标记 needSync，单个 rAF 内 先写 scrollTop → 再批量读 getBoundingClientRect → 再批量写 SVG 属性

### 控件交互优化：桥区列头设置浮窗

**问题**：滚动同步/桥线开关放在左面板标题栏，位置不自洽、占用主空间
**方案**：
- 开关移入桥区列头 → 浮窗（控制权归属于控制对象）
- Alt+滚动 = 临时独立滚动（动作而非状态）
- 底部栏改为上下文信息（当前区块、进度条）

**实现**：
1. 桥区列头 ⚙ 图标 → 后改为链接图标 (🔗 SVG)
2. hover 触发浮窗（非 click），鼠标移出才关闭
3. 开关操作不关闭浮窗
4. Alt 键检测 + 底部栏状态切换
5. 底部栏：当前区块(n/N) + 左右滚动进度条 + Alt 提示

### 控件细节优化

**4 项微调**：
1. 图标从 ⚙ 换为链接图标 SVG（更贴切表达"联动"）
2. 点击区域从 18×18 增大到 28×28，整个列头都可交互
3. 触发方式从 click → hover（mouseenter/mouseleave）
4. 浮窗消失逻辑：开关操作不关闭，鼠标移出 150ms 后关闭

## 产出文件

| 文件 | 说明 |
|---|---|
| `public/demos/04-panel-alignment.html` | 桥线连接器 + 分段线性映射滚动同步 + 设置浮窗 |

（01/02/03 为前序对话产出，本次未修改）

## 子 Agent 使用情况

本次全程 Opus 直接编码，未使用子 Agent。原因：demo 原型涉及算法设计（滚动映射）+ 交互细节（SVG 持久化、pointer 追踪），拆分困难且需要频繁根据浏览器验证结果调整。

## 验收确认
- `npm run dev`: ✅（端口 5173/5175 均正常）
- 浏览器验证: ✅ 桥线渲染、hover 浮窗、滚动同步、Alt 独立滚动、底部栏上下文均可用
- `npm run build`: 未执行（demo 为 public 静态文件，不影响构建）
- `npx tsc -b --noEmit`: 未执行（demo 为纯 HTML，无 TypeScript）
