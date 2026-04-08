# SkillForge

SkillForge 是面向 OpenClaw 的 Skill 可视化配置工具。通过 Web 界面帮助用户浏览、检视、配置并校验 OpenClaw Skill，减少手工编辑 `SKILL.md` 与配套 JSON 的负担。

## 技术栈


| 类别     | 选型                      |
| ------ | ----------------------- |
| 运行时与语言 | React 19、TypeScript 5.9 |
| 构建     | Vite 8                  |
| 样式     | Tailwind CSS v4         |
| 组件库    | shadcn/ui v4（Base UI）   |
| 路由     | React Router v7         |


## 功能概览

1. **Skill 解析与展示**：解析 `SKILL.md`（YAML frontmatter + Markdown 正文），并以结构化方式呈现。
2. **可视化配置编辑**
  - Frontmatter：名称、描述、版本、主页、环境变量等
  - `sources.json`：约 167 条数据源，支持启用/禁用、优先级与类型标识
  - `topics.json`：主题标签、检索查询与展示相关设置
  - `schema.json`：JSON Schema 查看
3. **实时预览**：根据已编辑的 frontmatter 重新生成 `SKILL.md` 预览；JSON 配置变更同步预览。
4. **导出与下载**：将编辑后的配置导出为 JSON；导出 `SKILL.md`。
5. **Skill 校验**：命名规范、必填字段、环境变量完整性等检查。
6. **深色模式**：开关与系统偏好联动，状态持久化到 `localStorage`。
7. **搜索与筛选**：按 Skill 名称或描述筛选列表。
8. **错误处理**：错误边界包裹，支持重试。

## 内置测试数据

仓库内附带 8 个来自真实 OpenClaw 实例的 Skill，便于本地开发与验收：


| Skill                                          | 说明             |
| ---------------------------------------------- | -------------- |
| `tech-news-digest`                             | 复杂示例，含多配置文件与脚本 |
| `agent-browser`、`deep-writing`、`tiered-memory` | 常规 Skill       |
| `task-decomposer`、`skill-security-auditor`     | 任务与安全相关        |
| `url-reader`、`image-ocr`                       | 读取类 Skill      |


数据位于 `src/data/test-skills/`。

## 快速开始

```bash
npm install
npm run dev     # 开发：http://localhost:5173
npm run build   # 生产构建，输出到 dist/
npm run preview # 本地预览生产构建
```

其他常用脚本：`npm run lint`（ESLint）。

## 项目结构（`src/`）

```
src/
├── App.tsx                 # 根布局与路由入口
├── main.tsx                # 应用挂载
├── index.css               # 全局样式与 Tailwind
├── pages/                  # 页面：Skill 列表、详情
├── components/
│   ├── layout/             # 顶栏、侧栏等壳层
│   ├── skill-editor/       # Frontmatter、校验面板等
│   ├── config-editor/      # sources/topics/schema、预览与导出
│   └── ui/                 # shadcn 封装组件
├── hooks/                  # 主题、响应式等
├── lib/                    # 解析、序列化、校验、下载工具
├── types/                  # Skill 相关类型定义
└── data/                   # skill-loader、test-skills 示例数据
```

## 项目治理

进度与上下文说明见仓库内 `project-harness/` 目录。