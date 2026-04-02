---
description: OpenClaw 对话中的调研发现和前期产出分析
status: reference
last_updated: 2026-04-03
---
# OpenClaw 前期调研发现

> 本文件记录 2026-04-01 在 OpenClaw 上的调研结果，作为 SkillForge 项目的参考输入。

## 1. 竞品分析：Butlerclaw

- **GitHub**: github.com/metahuan/butlerclaw
- **技术栈**: Python + tkinter
- **开发周期**: 37 天
- **核心功能**: 一键安装 OpenClaw、技能市场浏览、版本切换
- **社区活跃度**: 低（14 次提交，无 Issues）
- **关键差距**: 只解决了安装部署问题，**未解决 Skill 深度配置和可视化编辑**

### SkillForge 的差异化机会
Butlerclaw 定位是"OpenClaw 安装管理器"，SkillForge 定位是"Skill 配置开发工具"，两者不直接竞争。

## 2. 用户痛点（来自社区调研）

来源：掘金、知乎、阿里云开发者、人人都是产品经理、Reddit r/openclaw

1. **Skill 配置复杂**：JSON/YAML 手工编辑，格式错误难排查
2. **依赖关系不透明**：不知道 Skill 之间如何互相影响
3. **调试困难**：工具调用链不可见，出错时不知道哪个环节有问题
4. **升级后 breaking change**：OpenClaw 2026.3.2 更新后工具默认禁用，大量用户困惑
5. **配置体系庞大**：以 tech-news-digest 为例，有 100+ 个数据源配置、主题过滤规则
6. **大多数人只用了 10% 的功能**：缺乏引导和可视化

## 3. 市场数据

- AI Agent 市场 2025 年 $7.84B → 2030 年 $52.62B（CAGR 46.3%）
- 低代码市场 2026 年 $31.6B
- 84% 的开发者在使用或计划使用 AI 工具
- 80% 的企业应用预计到 2026 年将嵌入 AI Agent

## 4. 技术验证（OpenClaw 做的原型）

OpenClaw 在调研阶段做了一个 SKILL.md 解析原型（Python），验证了：
- SKILL.md 的 YAML frontmatter 可以用正则/YAML parser 提取
- 工具定义可以通过 Markdown 语法规则解析
- 配置文件（JSON）可以动态生成表单

### 原型解析结果示例（weather skill）
```
名称: weather
描述: 获取当前天气和预报
工具数: 2
  1. exec - 执行shell命令以获取天气信息（4个参数）
  2. web_fetch - 获取天气API数据（2个参数）
```

## 5. 设计模式参考

从 n8n、Zapier、Make.com 等工具调研得出的设计模式：

### 配置界面设计模式
1. **导航树模式**：左侧树形导航，右侧配置面板
2. **工作台模式**：选项卡组织配置分区
3. **向导模式**：分步引导配置流程
4. **JSON Schema → 表单**：根据 Schema 自动生成表单控件
5. **分层配置**：基础 → 高级 → 专家，逐层展开

### 推荐的 SkillForge 设计方向
- 左侧 Skill 列表 + 右侧详情/配置面板（导航树模式）
- 配置项根据类型自动生成表单（开关、输入框、下拉、数组编辑器）
- 实时 YAML/JSON 预览

## 6. OpenClaw 服务器上的真实数据

Jason 的 OpenClaw 实例（`ssh openclaw`）有以下可用数据：
- **Skill 目录**: `/root/.openclaw/workspace/skills/`（18 个 Skill）
- **配置文件**: `/root/.openclaw/openclaw.json`
- **会话记录**: `/root/.openclaw/agents/main/sessions/`

### 可用于开发和测试的 Skill 列表
| Skill ID | 名称 | 有配置文件 | 复杂度 |
|----------|------|-----------|--------|
| tech-news-digest | 科技新闻摘要 | 是（sources.json, topics.json） | 高 |
| deep-writing | 深度写作 | 待确认 | 中 |
| agent-browser | 浏览器自动化 | 待确认 | 中 |
| url-reader | URL 内容读取 | 待确认 | 低 |
| weather | 天气查询 | 否 | 低 |
| tiered-memory | 分层记忆 | 待确认 | 高 |

## 7. OpenClaw 前次开发失败的教训

| 失败点 | 原因 | SkillForge 的对策 |
|--------|------|------------------|
| 过度分析 | 花了 70% 时间写 PRD 和市场分析 | 直接写代码，边做边调 |
| 反复重建 | 4 次从零建项目 | 一次搭好骨架，迭代增量开发 |
| 前端粗糙 | 静态 HTML，没有真实交互 | 用 React/Vue + 组件库，正经做 |
| 核心功能缺失 | 只做了"查看"没做"配置" | MVP 就要包含配置编辑能力 |
| 解析不完整 | Skill tools 都解析为空数组 | 投入精力做好 SKILL.md parser |
| ES Module 错误 | require/import 混用 | 统一技术栈，TypeScript 严格模式 |
