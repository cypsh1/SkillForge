# D2 Demo 方案落地到主应用 执行记录

**日期**: 2026-04-06
**执行模式**: Opus 规划/审查 + fast 子 Agent 编写代码

## 调研记录

豁免调研：本次是将已验证的 Demo 方案（04-panel-alignment.html + 05-complete.html）落地到 React 组件体系中，不涉及新技术选型或新功能设计。Demo 阶段已完成全部方案验证。

## 批次执行

### Batch 1：核心 Hook + 区块定义
- 操作：创建 `use-panel-sync.ts`（锚点缓存 + 分段线性映射 + Alt 独立滚动 + 指针追踪 + rAF 合并）和 `bridge-sections.ts`（3 个区块定义）
- 结果：hook 导出 PanelSyncApi + PanelSyncContext

### Batch 2：BridgeConnector SVG 组件
- 操作：委派 fast Agent 创建 bridge-connector.tsx
- 审查修正：
  - 移除 separatorRef（react-resizable-panels 的 Separator 不方便传 ref），改为从 editor/inspector 容器推算桥线区域
  - 修正虚线逻辑：从比较高度差改为比较两侧 y 位置差
  - 调整 hover/normal 线条透明度（0.28→0.85）
  - 修复 useRef 初始值问题（React 19 要求）
  - 修复 SVG line spread 导致 `dashed` boolean 泄漏到 DOM 的问题
  - 添加 toggleSync 的 onClick handler

### Batch 3：ContextBar 底部上下文栏
- 操作：委派 fast Agent 创建 context-bar.tsx
- 结果：一次通过，质量好

### Batch 4：面板修改
- 操作：并行委派两个 fast Agent 修改 editor-panel.tsx 和 inspector-panel.tsx
- editor-panel：替换 ScrollArea 为原生滚动 div + ref，FrontmatterForm/Tools/DocStructure 添加 data-bridge-section
- inspector-panel：SKILL.md 预览拆分为三段（splitPreview helper），添加 SectionedPreview 组件
- 结果：两个 Agent 一次通过

### Batch 5：App.tsx 集成
- 操作：Opus 直接修改，添加 PanelSyncContext.Provider + BridgeConnector + ContextBar + layoutRef
- 添加 bridge-highlight CSS 到 index.css

### Batch 6：构建验证
- `npx tsc -b --noEmit`: ✅（修复 2 个 TS 错误后通过）
- `npm run build`: ✅（908KB JS + 88KB CSS）
- 浏览器验证: 选择 SKILL.md 视图后，桥线 + 滚动同步 + 底部栏均可见可用

## 新增/修改文件

| 文件 | 操作 |
|---|---|
| `src/hooks/use-panel-sync.ts` | 新建 |
| `src/lib/bridge-sections.ts` | 新建 |
| `src/components/workspace/bridge-connector.tsx` | 新建 |
| `src/components/workspace/context-bar.tsx` | 新建 |
| `src/components/workspace/editor-panel.tsx` | 修改 |
| `src/components/workspace/inspector-panel.tsx` | 修改 |
| `src/App.tsx` | 修改 |
| `src/index.css` | 修改 |

## 子 Agent 使用情况

| 任务 | 模型 | 质量 | 备注 |
|---|---|---|---|
| BridgeConnector SVG 组件 | fast | ⚠️ | 需要多处修正：separatorRef 移除、虚线逻辑、useRef 初始值、SVG spread、toggleSync handler |
| ContextBar 底部上下文栏 | fast | ✅ | 一次通过，无需修改 |
| editor-panel 修改 | fast | ✅ | 准确完成 |
| inspector-panel 修改 | fast | ✅ | 准确完成 |

## 验收确认
- `npm run dev`: ✅
- `npm run build`: ✅
- `npx tsc -b --noEmit`: ✅
- 浏览器验证: 桥线连接器、滚动同步、底部上下文栏均正常工作

## 经验总结
- BridgeConnector 的复杂度较高（SVG + DOM 测量 + 事件处理），委派给 fast 模型需要较多修正；建议此类涉及 DOM 交互的组件由主对话直接编写
- 面板修改（添加 data 属性 + 替换 ScrollArea）是 fast 模型的理想任务，规格明确时一次通过
