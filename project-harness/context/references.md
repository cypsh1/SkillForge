---

## description: 调研过程中发现的有价值的参考资料（含对比决策）
status: active
last_updated: 2026-04-09

# 参考资料

> 调研过程中发现的有价值的产品、技术、设计参考，在此统一记录。
> **格式要求**：技术选型必须记录"对比了什么、为什么不选"，不只记结论。

## 产品参考

- [Butlerclaw](https://github.com/metahuan/butlerclaw) — OpenClaw GUI 工具，Python+tkinter，只解决安装问题，不解决 Skill 配置
- [Skill Creator (KiwiClaw)](https://kiwiclaw.app/skills/skill-creator/) — OpenClaw 技能创建引导工具，通过对话引导完成 Skill 生命周期
- [ClawSmith](https://playbooks.com/skills/openclaw/skills/clawsmith) — 10 种模式的 Skill 创建/优化向导
- [Agentman](https://myagentskills.ai/create) — 无代码 Skill 构建器（快速创建/克隆/从零构建三种路径）
- [SkillGen](https://skillgen.io/) — 可视化 Block 构建器 + 多框架导出

## 技术参考

### 构建工具

- [Vite v8](https://vite.dev/) — 选定，快速 HMR，轻量无 SSR
  - 对比过：Next.js — 不选，MVP 不需要 SSR，增加复杂度
- [Vite — `import.meta.glob](https://vite.dev/guide/features.html#glob-import)` — 用途：`src/data/test-skills/` 下 SKILL/config/extra 自动发现，避免手工 import；2026-04-09 用于 V1.1-DATA
  - 对比过：构建时 Node 脚本生成 `files.json` — 不选原因：增加构建步骤与缓存失效心智负担，glob 与 Vite 原生集成更简单

### 前端框架

- [React 19](https://react.dev/) — 选定，生态最大，shadcn/ui 原生支持
  - 对比过：Vue 3 — 不选，shadcn/ui 是 React 生态，选 Vue 需要换组件库

### UI 组件库

- [shadcn/ui v4](https://ui.shadcn.com/) — 选定，基于 Radix + Tailwind，可定制性强
  - 对比过：Ant Design — 不选，样式偏重，定制成本高

### CSS 框架

- [Tailwind CSS v4](https://tailwindcss.com/) — 选定，与 shadcn/ui 配套

### 分栏布局

- [react-resizable-panels v4.9](https://github.com/bvaughn/react-resizable-panels) — 选定，<5KB，React 19 兼容
  - 注意：v4 API 与文档示例不同，`PanelGroup` → `Group`，`direction` → `orientation`

### 桌面封装

- [Tauri v2](https://v2.tauri.app/) — 选定，8MB 包体（vs Electron 120MB），内置文件系统 API
  - 对比过：Electron — 不选，120MB 包体，300MB 内存占用

## 设计参考

- **DaVinci Resolve** — 三栏面板布局（媒体浏览器 | 预览/时间线 | 检查器），面板可调整/折叠
- **Beyond Compare / VS Code Merge Editor** — SVG 桥线连接器（梯形映射两侧区块），分段线性滚动同步
  - 借鉴：桥线形状表达高度差（梯形宽边=较高侧、斜线=错位、实线=等高）
  - 借鉴：分段线性映射算法（区块 top 做锚点，段内等比插值）
- **Tiptap Split View** — 垂直对齐 + hover 区块高亮（前序对话调研，03-fusion 采用）
- **DatoCMS ContentLink** — 点击预览区域自动滚动到最近可编辑元素（前序对话调研）
- [Retool Inspector](https://retool.com/blog/simplifying-retools-inspector) — 配置面板简化设计，统一分组概念
- [Retool Tree Data UI](https://retool.com/blog/designing-a-ui-for-tree-data) — 复杂树形数据的 UI 设计
- n8n 节点配置 UI — 配置面板交互参考
- [Zed Settings UI](https://zed.dev/blog/settings-ui) — 开发者工具配置界面设计

### 关系可视化交互（2026-04-06）

- [TanStack Devtools — Bidirectional Communication](https://tanstack.com/devtools/latest/docs/bidirectional-communication) — 借鉴：观察事件与命令事件分离、面板→应用双向控制模式，映射到 `selectedEid`/`selectRelationTarget` 的状态协议
- [Hygraph Schema Graph](https://hygraph.com/docs/experimental/schema-graph) — 借鉴：关系节点的可视化探索路径（选中→关联高亮→上下文详情）
  - 对比过：[GoJS Tree Mapper](https://gojs.net/latest/samples/treeMapper.html) — 不选原因：偏重拖拽建模与画布交互，超出当前「编辑器/源码双栏」范围
  - 对比过：[Rich Tooltip（Helios Design System）](https://helios.hashicorp.design/components/rich-tooltip) — 不选原因：仅 tooltip 不足以承载关系路径，仍需持久化关系栏
- [Google Code Search — Cross References](https://developers.google.com/code-search/user/cross-references) — 借鉴：跨引用导航采用“可点击目标 + 上下文说明”的低认知负担模式，落地为 Relation Bar 的「关系类型 + 目标 + 描述」

### 实体规则动态化策略决策（2026-04-06）

- **策略 A（选定）**：仅动态化 `INSPECTOR_ENTITY_RULES`（从 Skill 数据生成 regex），`BRIDGE_RELATIONS` 保持 tech-news-digest 的手工语义关系
- **策略 B（不选）**：两者都动态化，自动推断语义关系
  - 不选原因：语义关系（"GITHUB_TOKEN 被 fetch-github.py 使用"、"mail 和 gog 互为替代"）无法从纯数据结构推断，需要人工标注或 AI 辅助；虚假的自动推断比没有关系更差
  - 未来可考虑：用 LLM 分析 SKILL.md 自动生成关系数据，作为增量功能

### Markdown 解析引擎选型（2026-04-08）

- [remark-parse (unified 生态)](https://github.com/remarkjs/remark) — 选定，AST 导向，支持双向操作（parse + stringify），300+ 插件，TypeScript 原生
  - 对比过：[markdown-it](https://github.com/markdown-it/markdown-it) — 不选原因：token 是扁平流式结构非树形，不内置 Markdown 反序列化（只做 MD→HTML），需额外实现 raw round-trip
  - 对比过：[marked](https://github.com/markedjs/marked) — 不选原因：无 AST 访问，只做 Markdown→HTML 单向转换，无法拆分为可编辑的结构化片段
- 安装包：unified@11, remark-parse@11, remark-stringify@11, remark-frontmatter@5, remark-gfm@4, @types/mdast

## 竞品/同类工具

- [Butlerclaw](https://github.com/metahuan/butlerclaw) — OpenClaw GUI，只做安装管理，不做 Skill 配置