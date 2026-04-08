# V1-5 代码分割 执行记录

**日期**: 2026-04-08
**执行模式**: Opus 直接编写（任务简单明确，无需子 Agent 委派）

## 调研记录

豁免调研。原因：纯 React.lazy + dynamic import 标准模式，已有技术栈内的重复模式，无需引入新依赖或新交互。

## 批次执行

### 步骤 1：分析当前 bundle 构成

- 操作：运行 `npm run build` 分析当前产出
- 结果：单一 JS 包 1,235 KB（gzip 371 KB），Vite 警告 chunk 过大
- 发现：测试数据（771KB 原始文件）、markdown 引擎、表单库、全部组件都在同一个 bundle

### 步骤 2：提取 WorkspaceShell + 异步数据加载

- 操作：
  - 新建 `src/components/workspace-shell.tsx`，从 App.tsx 提取 WorkspaceShell 组件
  - React.lazy 加载 WorkspaceShell
  - `useSkills` 改为 dynamic import 异步加载 `skill-loader.ts`
  - 内联 `isTauri()` 检查，避免静态导入 tauri-fs 拉入 skill-parser
- 结果：首屏包从 1,235 KB 降至 271 KB

### 步骤 3：移除首屏 shadcn/ui 依赖

- 操作：
  - ErrorBoundary 改用内联样式，去除 Button/Card/lucide-react 依赖
  - TooltipProvider + Toaster 移入 WorkspaceShell（首屏不需要）
  - App.tsx 精简为仅依赖 React + ErrorBoundary
- 结果：首屏包从 271 KB 降至 234 KB + 8.5 KB preload = **243 KB**

### 步骤 4：editor-panel 子视图 lazy 加载

- 操作：SourcesEditor、TopicsEditor、SchemaViewer、ExtraFileEditor、ValidationPanel 改为 React.lazy + Suspense
- 结果：配置编辑器、extra 文件编辑器、markdown 引擎都变为按需加载的独立 chunk

### 步骤 5：验收确认

- `npx tsc -b --noEmit`: ✅（0 错误）
- `npm run build`: ✅（0 警告）
- 首屏 JS: 243 KB < 300 KB ✅
- Linter: ✅（0 错误）

## 产出文件清单

| 操作 | 文件 |
|---|---|
| 新建 | `src/components/workspace-shell.tsx` — WorkspaceShell 独立模块 |
| 重写 | `src/App.tsx` — 精简为 React.lazy + Suspense 薄壳 |
| 重写 | `src/components/error-boundary.tsx` — 去除 shadcn/ui 依赖 |
| 修改 | `src/components/workspace/editor-panel.tsx` — 5 个子编辑器 lazy 加载 |

## Bundle 对比

| 指标 | 改动前 | 改动后 | 变化 |
|---|---|---|---|
| 首屏 JS | 1,235 KB | 243 KB | **-80%** |
| 首屏 gzip | 371 KB | 78 KB | **-79%** |
| 总 chunk 数 | 3 | 22 | 按需加载 |
| CSS | 109 KB | 109 KB | 不变 |

### 主要 chunk 分布

| Chunk | 大小 | 加载时机 |
|---|---|---|
| index (入口) | 234 KB | 首屏 |
| jsx-runtime | 9 KB | 首屏 preload |
| workspace-shell | 326 KB | 技能数据就绪后 |
| skill-loader | 283 KB | 异步加载 |
| markdown-engine | 202 KB | 打开 Markdown 文件时 |
| browser (react-dom 共享) | 97 KB | workspace-shell 依赖 |
| 其余 17 个 chunk | 1-27 KB 各 | 按需 |

## 子 Agent 使用情况

本次未使用子 Agent。任务涉及架构层面的代码分割决策（哪些放首屏、哪些 lazy），适合 Opus 直接执行。

## 验收确认

- `npm run dev`: ✅
- `npm run build`: ✅
- `npx tsc -b --noEmit`: ✅
- 首屏 JS < 300 KB: ✅（243 KB）
- 浏览器验证: 需人工确认（dev server 已启动，切换 Skill/编辑/保存功能路径未受影响）
