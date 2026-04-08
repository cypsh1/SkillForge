# UX 体验优化 + Extra-file 桥线联动补齐 执行记录

**日期**: 2026-04-08
**执行模式**: Opus 规划/审查/核心编写 + fast 子 Agent 执行明确编辑

## 调研记录

纯工程优化 + 已有机制迁移，无需外部调研。豁免原因：不涉及新技术选型，是将 SKILL.md 已有的桥线/联动机制泛化到 extra-file。

## 批次执行

### 步骤 1：全部展开/收起 + 折叠联动
- use-panel-sync.ts：新增 expand/collapse 状态 + tick 机制 + 联动逻辑
- editor-panel.tsx：BridgeSectionBlock 响应全局 tick + 标题栏按钮
- inspector-panel.tsx：PreviewSectionBlock 响应全局 tick + 标题栏按钮
- extra-file-editors.tsx：FileSection 响应全局 tick
- bridge-connector.tsx：面板联动浮窗新增"折叠联动"开关
- context-bar.tsx：移除多余的折叠联动按钮（用户反馈后迁移到浮窗）

### 步骤 2：Extra-file 右侧源码预览
- inspector-panel.tsx：新增 extra-file 渲染分支（showExtraChrome）
- 标题栏显示文件名，源码用 sugar-high 高亮

### 步骤 3：桥线泛化
- bridge-connector.tsx：配对逻辑从遍历 BRIDGE_SECTIONS 改为扫描 DOM
- extra-file-editors.tsx：FileSection + data-bridge-section
- fragment-renderer.tsx：FragmentBlock + data-field wrapper

### 步骤 4：右侧结构化源码预览
- inspector-panel.tsx：ExtraFileSourcePreview 组件
- parseDocument() 解析与左侧相同结构，每段带匹配的 data-bridge-section + data-field

## 子 Agent 使用情况

| 任务 | 模型 | 质量 | 备注 |
|---|---|---|---|
| FileSection + FragmentBlock 加 data 属性 | fast | ✅ | 明确规格，一次通过 |
| harness 文档更新 | fast | ✅ | 模板化操作 |

## 验收确认
- `npx tsc -b --noEmit`: ✅
- `npm run build`: ✅（1200KB JS）
- Linter: ✅
- 浏览器验证:
  - README.md：✅ 右侧结构化源码 + section 对齐 + 桥线区域就绪
  - CHANGELOG.md：✅ 同上
  - SKILL.md：✅ 8 段区块完全不受影响
  - 全部展开/收起：✅ 两侧独立控制正常
  - 折叠联动：✅ 开启后两侧同步
