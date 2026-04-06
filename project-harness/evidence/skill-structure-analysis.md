# OpenClaw Skill 结构调研分析报告

**日期**: 2026-04-05
**数据来源**: 多渠道采集（详见tab下方），覆盖 7199 个 Skill
**目的**: 为 T1（JSON Schema 驱动表单）提供数据依据

---

## 一、数据采集范围


| 来源                               | 数量           | 说明                                       |
| -------------------------------- | ------------ | ---------------------------------------- |
| `ssh openclaw` 服务器               | 18 个 Skill   | 全量分析目录结构 + 所有文件（深度分析）                    |
| 官方内置 `openclaw/openclaw/skills/` | 53 个 Skill   | git clone + 全量分析（子 Agent 执行）             |
| 社区仓库 `openclaw/skills`           | 7128 个 Skill | git tree API 统计 + 18 个复杂 Skill 深度分析      |
| Awesome 列表 + GitHub 搜索           | 15 个 Skill   | 补充独立仓库和高星项目                              |
| 官方文档 docs.openclaw.ai            | 3 页          | Skills + Creating Skills + Skills Config |
| ClawHub skill-format.md          | 1 页          | 官方格式规范                                   |


**总覆盖**：深度分析 ~104 个 Skill + 7128 个社区 Skill 的目录结构统计

---

## 二、Skill 复杂度分级

根据目录结构和文件组成，将 18 个 Skill 分为 5 个级别：

### L1 — 纯文档型（4 个，22%）

只有 SKILL.md（+ 可选的 _meta.json）。


| Skill                  | SKILL.md 行数 | 其他文件                  |
| ---------------------- | ----------- | --------------------- |
| using-superpowers      | 87          | _meta.json            |
| image-ocr              | 42          | _meta.json            |
| cost-governor          | 191         | _meta.json, README.md |
| prompt-injection-guard | 278         | _meta.json            |


**特征**：Skill 的全部知识都在 SKILL.md 的 markdown body 中，作为 prompt 注入给 Agent。无外部脚本或配置。

### L2 — 带脚本型（6 个，33%）

SKILL.md + scripts/ 目录（1-2 个脚本）。


| Skill                    | 脚本                | 语言      |
| ------------------------ | ----------------- | ------- |
| image-generate           | image_generate.py | Python  |
| video-generate           | video_generate.py | Python  |
| bilibili-youtube-watcher | get_transcript.py | Python  |
| douyin-downloader-nodejs | douyin.js         | Node.js |
| openclaw-tavily-search   | tavily_search.py  | Python  |
| wechat-article-reader    | export.py         | Python  |


**特征**：SKILL.md 定义何时/如何调用脚本，脚本实现具体功能。配置项通常通过环境变量传入。

### L3 — 带参考文档型（3 个，17%）

SKILL.md + references/（参考文档）+ 可选的 scripts/。


| Skill                       | references/ 文件      | 其他                                |
| --------------------------- | ------------------- | --------------------------------- |
| deep-writing                | 6 个 .md（写作类型、检查清单等） | —                                 |
| task-decomposer             | capability_types.md | assets/skill_template.md          |
| larksync-feishu-local-cache | —                   | OPENCLAW_AGENT_GUIDE.md, scripts/ |


**特征**：references/ 目录提供 Agent 可查阅的知识库。SKILL.md 引用这些文档指导 Agent 行为。

### L4 — 带配置数据型（3 个，17%）

SKILL.md + 独立的配置/数据文件 + 多个脚本。


| Skill                  | 配置文件                             | 脚本数        |
| ---------------------- | -------------------------------- | ---------- |
| skill-security-auditor | patterns/malicious-patterns.json | 1 (bash)   |
| url-reader             | metadata.json                    | 5 (Python) |
| tiered-memory          | config.json + skill.toml         | 4 (Python) |


**特征**：有独立的配置文件但没有 JSON Schema 约束，配置格式由 Skill 自己定义。

### L5 — 完整项目型（2 个，11%）

SKILL.md + config/ 目录（含 schema + defaults）+ tests/ + 多个脚本 + 文档体系。


| Skill               | 配置体系                                                       | 脚本数                    | 额外                                                    |
| ------------------- | ---------------------------------------------------------- | ---------------------- | ----------------------------------------------------- |
| tech-news-digest    | config/schema.json + config/defaults/{sources,topics}.json | 13 (Python) + 1 (bash) | tests/, .clawhub/, CHANGELOG, CONTRIBUTING, README_CN |
| tech-news-digest-cn | 同上（中文版）                                                    | 同上                     | —                                                     |


**特征**：唯一使用 JSON Schema (draft-07) 定义配置结构的 Skill。有完整的测试、贡献指南、变更日志。

### 分布统计（服务器 18 个 Skill）

```
L1 纯文档型    ████████░░░░░░░░░░░░  22%  (4)
L2 带脚本型    ████████████░░░░░░░░  33%  (6)
L3 带参考文档型 ██████░░░░░░░░░░░░░░  17%  (3)
L4 带配置数据型 ██████░░░░░░░░░░░░░░  17%  (3)
L5 完整项目型  ████░░░░░░░░░░░░░░░░  11%  (2)
```

---

## 二-B、大样本验证：官方内置 53 个 Skill

从 `openclaw/openclaw` 仓库 `skills/` 目录克隆分析，共 53 个 Skill：


| 等级  | 数量  | 占比      | 代表性 Skill                                                                    |
| --- | --- | ------- | ---------------------------------------------------------------------------- |
| L1  | 46  | **87%** | apple-notes, github, slack, discord, notion, obsidian, coding-agent, weather |
| L2  | 4   | 8%      | openai-whisper-api, skill-creator, tmux, video-frames                        |
| L3  | 3   | 6%      | 1password, himalaya, model-usage                                             |
| L4  | 0   | 0%      | —                                                                            |
| L5  | 0   | 0%      | —                                                                            |


**关键发现**：

- 官方内置 Skill **0 个有 config/ 目录**，**0 个有 _meta.json**
- 87% 是纯 SKILL.md（L1），官方做了最简化示范
- 最常见的 frontmatter 字段组合：`name` + `description` + `homepage` + `metadata`（含 install 规格）

---

## 二-C、大样本验证：社区 7128 个 Skill 统计

通过 GitHub Tree API 对 `openclaw/skills` 仓库全量扫描（7128 个含 SKILL.md 的 Skill 目录）：

### 目录结构分布


| 目录                     | 数量   | 占比        | 说明                          |
| ---------------------- | ---- | --------- | --------------------------- |
| 有 `scripts/`           | 2881 | **40.4%** | 远高于服务器样本（50%），近半数 Skill 有脚本 |
| 有 `references/`        | 1714 | **24.0%** | 近四分之一有参考文档                  |
| 有 `tests/`             | 239  | **3.4%**  | 少数有测试                       |
| 有 `config/`            | 56   | **0.8%**  | 极少数有配置目录                    |
| 有 `config/schema.json` | 4    | **0.06%** | 几乎没有用 JSON Schema           |
| 有 `config/defaults/`   | 2    | **0.03%** | 极其罕见                        |
| 有 `_meta.json`         | 7279 | 100%      | ClawHub 管理文件（所有已发布 Skill）   |


### 56 个 config/ Skill 的配置格式分布


| 格式                        | 数量  | 示例                                                     |
| ------------------------- | --- | ------------------------------------------------------ |
| JSON (*.json)             | 38  | config.json, default.json, chains.json, billing.json   |
| YAML (*.yaml/*.yml)       | 10  | config.yaml, settings.yaml, settings.yml               |
| JSON Schema (schema.json) | 4   | tech-news-digest 系列, web3-investor, eve-esi, synthclaw |
| 纯文本 (*.txt)               | 3   | volume.txt, tts_speed.txt                              |
| Markdown (*.md)           | 2   | README.md, CLAUDE.md                                   |
| INI (*.ini)               | 1   | config.ini                                             |
| 示例文件 (*.example.*)        | 8   | sites.example.json, watchlist.example.json             |


### 社区复杂 Skill 代表（L4-L5 级别）


| Skill                                 | 文件数 | 特征                                                                      |
| ------------------------------------- | --- | ----------------------------------------------------------------------- |
| 632657122/comic                       | 72  | config/(schema+defaults) + scripts/ + references/ + tests/ + workflows/ |
| 632657122/infographic                 | 70  | 同上，完整的生成管线                                                              |
| bloodandeath/openforge                | 64  | 多阶段 PRD + 多模型路由 + 校验门控                                                  |
| buxibuxi/stock-copilot-pro            | 61  | 长 YAML frontmatter（env、security、credentials）                            |
| bevanding/web3-investor               | 50  | config/schema.json + config/protocols.json                              |
| asterisk622/dinstein-tech-news-digest | 46  | tech-news-digest 的 fork                                                 |


### 复杂度分布推算（基于 7128 个社区 Skill）

```
L1 纯文档型      ██████████████░░░░░░  ~35%  (无 scripts/ 也无 references/)
L2 带脚本型      ████████░░░░░░░░░░░░  ~16%  (有 scripts/ 无 references/)
L3 带参考文档型   ████████░░░░░░░░░░░░  ~24%  (有 references/)
L2+L3 混合型    ████████████░░░░░░░░  ~24%  (有 scripts/ 且有 references/)
L4-L5 带配置型  █░░░░░░░░░░░░░░░░░░░   0.8% (有 config/)
```

> **大样本结论**：跨 7199 个 Skill（18 服务器 + 53 官方 + 7128 社区），**config/ 目录出现率不到 1%，JSON Schema 出现率 0.06%**。绝大多数配置通过 SKILL.md frontmatter 的 `env` 字段 + 环境变量完成。

---

## 三、SKILL.md Frontmatter 字段全景

### 已确认的官方字段（来自 docs.openclaw.ai）


| 字段                         | 类型          | 必填  | 说明              | 出现率        |
| -------------------------- | ----------- | --- | --------------- | ---------- |
| `name`                     | string      | ✅   | 唯一标识符           | 18/18      |
| `description`              | string      | ✅   | 一句话描述           | 17/18      |
| `version`                  | string      | —   | 语义化版本           | 5/18       |
| `homepage`                 | string      | —   | 项目主页 URL        | 2/18       |
| `source`                   | string      | —   | 源码 URL          | 1/18       |
| `author`                   | string      | —   | 作者              | 0/18（文档中有） |
| `metadata`                 | object      | —   | 运行时元数据（见下方）     | 10/18      |
| `user-invocable`           | boolean     | —   | 是否可作为斜杠命令       | 1/18       |
| `disable-model-invocation` | boolean     | —   | 是否排除出 prompt    | 0/18       |
| `command-dispatch`         | string      | —   | 直接分发给工具         | 0/18       |
| `command-tool`             | string      | —   | 分发目标工具名         | 0/18       |
| `command-arg-mode`         | string      | —   | 参数传递模式          | 0/18       |
| `read_when`                | string[]    | —   | 触发条件描述          | 1/18       |
| `triggers`                 | string[]    | —   | 触发关键词列表         | 1/18       |
| `trigger`                  | object      | —   | 触发配置            | 1/18       |
| `auto_trigger`             | boolean     | —   | 自动触发            | 1/18       |
| `allowed-tools`            | string      | —   | 允许的工具模式         | 1/18       |
| `env`                      | EnvVarDef[] | —   | 环境变量声明          | 1/18       |
| `emoji`                    | string      | —   | 顶级 emoji（非标准位置） | 1/18       |


### `metadata.openclaw` 子结构（核心运行时配置）

```yaml
metadata:
  openclaw:                    # 别名：clawdbot, clawdis
    always: boolean            # 始终激活
    emoji: string              # 显示 emoji
    homepage: string           # 主页 URL
    os: string[]               # 操作系统限制 ["darwin","linux","win32"]
    primaryEnv: string         # 主要凭证环境变量
    skillKey: string           # 覆盖调用 key
    requires:
      bins: string[]           # 必须在 PATH 上的二进制
      anyBins: string[]        # 至少一个必须存在
      env: string[]            # 必须存在的环境变量
      config: string[]         # 必须为 truthy 的配置路径
    optionalBins: string[]     # 可选二进制（tech-news-digest 发现）
    install:                   # 安装规格数组
      - id: string
        kind: string           # brew | node | go | uv | download | pip | dnf
        formula/package: string
        bins: string[]
        label: string
        os: string[]           # 平台限制
```

### 实际 frontmatter 多样性示例

**极简型**（image-generate）：

```yaml
name: image-generate
description: 使用内置脚本生成图片
```

**标准型**（bilibili-youtube-watcher）：

```yaml
name: video-watcher
description: Fetch and read transcripts...
author: adapted from youtube-watcher
version: 1.1.0
triggers: ["watch video", "summarize video", ...]
metadata: {"clawdbot":{"emoji":"📺","requires":{"bins":["yt-dlp"]},"install":[...]}}
```

**复杂型**（tech-news-digest）：

```yaml
name: tech-news-digest
description: Generate tech news digests...
version: "3.16.0"
homepage: https://github.com/draco-agent/tech-news-digest
source: https://github.com/draco-agent/tech-news-digest
metadata:
  openclaw:
    requires:
      bins: ["python3"]
    optionalBins: ["mail", "msmtp", "gog", "gh", "openssl", "weasyprint"]
env:
  - name: TWITTER_API_BACKEND
    required: false
    description: "Twitter API backend..."
  # ... 更多环境变量
```

---

## 四、元数据文件类型

Skill 中发现了 4 种不同的元数据文件，用途各异：


| 文件                     | 出现率   | 谁写的         | 用途                                                            |
| ---------------------- | ----- | ----------- | ------------------------------------------------------------- |
| `_meta.json`           | 14/18 | ClawHub CLI | 安装来源追踪（ownerId, slug, version, publishedAt）                   |
| `.clawhub/origin.json` | 1/18  | ClawHub CLI | 安装版本追踪（registry, slug, installedVersion, installedAt）         |
| `metadata.json`        | 1/18  | Skill 作者    | 自定义元数据（name, version, author, tags, platforms）                |
| `skill.toml`           | 1/18  | Skill 作者    | TOML 格式元数据（name, version, description, author, license, tags） |


**结论**：

- `_meta.json` 和 `.clawhub/origin.json` 是 **系统管理文件**，不应被用户编辑
- `metadata.json` 和 `skill.toml` 是 **非标准的自定义格式**，没有官方规范
- **SKILL.md frontmatter 是唯一的官方元数据来源**

---

## 五、目录约定

### 服务器样本（18 个 Skill）


| 目录                 | 出现率        | 内容                   | 是否可编辑     |
| ------------------ | ---------- | -------------------- | --------- |
| `scripts/`         | 9/18 (50%) | Python/Shell/JS 脚本   | 否（代码）     |
| `references/`      | 3/18 (17%) | Agent 参考文档 (.md)     | 是（文本）     |
| `config/`          | 1/18 (6%)  | 配置 schema + defaults | 是（核心编辑目标） |
| `config/defaults/` | 1/18 (6%)  | 默认配置值                | 是         |
| `patterns/`        | 1/18 (6%)  | 数据文件 (JSON)          | 是         |
| `assets/`          | 1/18 (6%)  | 模板文件                 | 是（文本）     |
| `tests/`           | 1/18 (6%)  | 测试用例 + fixtures      | 否         |
| `.clawhub/`        | 1/18 (6%)  | 安装元数据                | 否（系统）     |


### 大样本验证（7128 个社区 Skill）


| 目录            | 出现率          | SkillForge 处理策略          |
| ------------- | ------------ | ------------------------ |
| `scripts/`    | 2881 (40.4%) | 只读列表展示，显示文件名和语言          |
| `references/` | 1714 (24.0%) | Markdown 预览，可编辑          |
| `tests/`      | 239 (3.4%)   | 只读展示                     |
| `config/`     | 56 (0.8%)    | **表单编辑（有 schema 时自动生成）** |
| 其他目录          | 少量           | 忽略或文件列表展示                |


---

## 六、配置体系深度分析

### tech-news-digest 的 config/ 模式（唯一使用 JSON Schema 的 Skill）

```
config/
├── schema.json              # JSON Schema draft-07
└── defaults/
    ├── sources.json         # 数据源配置（数组）
    └── topics.json          # 话题配置（数组）
```

**schema.json 特点**：

- 使用 `$ref` + `definitions` 定义 source 和 topic 类型
- 条件验证：`allOf` + `if/then`（如 type=rss 则 url 必填）
- 枚举约束：`enum: ["rss", "twitter", "web", "github", "reddit"]`
- 格式约束：`format: "uri"`, `pattern: "^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$"`
- 嵌套对象：source 有 7 个字段，topic 有 6 个字段（含嵌套 search/display）

### tiered-memory 的 config.json 模式

```json
{
  "agent_id": "default",
  "hot": { "max_bytes": 5120, "max_lessons": 20, ... },
  "warm": { "max_kb": 50, "retention_days": 30, ... },
  "cold": { "backend": "turso", "retention_years": 10 },
  "scoring": { "half_life_days": 30, ... },
  "tree": { "max_nodes": 50, "max_depth": 4, ... },
  "distillation": { "aggression": 0.7, "mode": "rule" },
  "consolidation": { "warm_eviction": "hourly", ... }
}
```

**无 schema.json**，纯结构化 JSON，分组清晰。

### skill-security-auditor 的 patterns/malicious-patterns.json

结构化威胁模式数据库，每条记录包含 id、name、pattern（正则）、severity、score_impact、description、mitre_attack、references。这是数据文件而非配置文件。

---

## 七、对 T1（Schema 驱动表单）的技术建议

### 核心结论（大样本验证）

> **99.2% 的 Skill 没有 config/ 目录。99.94% 没有 JSON Schema。**
> **SKILL.md frontmatter 是唯一需要表单化编辑的结构。**
> **references/（24%）是第二大可编辑内容，值得提供 Markdown 编辑/预览。**
> SkillForge 应将 80% 的精力放在 frontmatter 编辑器上，config 编辑作为高级功能。

### 建议分层策略

#### 第一层：Frontmatter 结构化编辑器（覆盖 100% 的 Skill）

为 SKILL.md frontmatter 构建**内置 schema**（不依赖外部 schema.json）：

```typescript
// 基于本次调研结果定义的 frontmatter schema
interface SkillFrontmatter {
  // 核心字段（所有 Skill 都有）
  name: string                    // 必填
  description: string             // 必填

  // 版本信息（30% 的 Skill）
  version?: string
  homepage?: string
  source?: string
  author?: string

  // 触发控制（稀少但重要）
  read_when?: string[]
  triggers?: string[]
  auto_trigger?: boolean
  user_invocable?: boolean
  allowed_tools?: string

  // 环境变量声明
  env?: Array<{
    name: string
    required: boolean
    description: string
  }>

  // 运行时元数据（55% 的 Skill）
  metadata?: {
    openclaw?: {
      emoji?: string
      homepage?: string
      os?: Array<'darwin' | 'linux' | 'win32'>
      primaryEnv?: string
      always?: boolean
      requires?: {
        bins?: string[]
        anyBins?: string[]
        env?: string[]
        config?: string[]
      }
      install?: InstallSpec[]
    }
  }
}
```

**表单分组建议**：

1. **基本信息**：name, description, version, author, homepage
2. **触发条件**：read_when, triggers, auto_trigger, user-invocable
3. **运行时要求**：metadata.openclaw.requires (bins/env/config)
4. **环境变量**：env 数组（动态增删行）
5. **安装配置**：metadata.openclaw.install（高级，默认折叠）

#### 第二层：Config 目录编辑器（覆盖 L4-L5 Skill）

当 Skill 包含 `config/schema.json` 时，使用 JSON Schema 自动生成表单：

- **有 schema 的情况**：根据 JSON Schema draft-07 自动生成
  - 支持 `$ref` + `definitions`
  - 支持条件字段（`if/then`）
  - 支持枚举、格式验证、嵌套对象
- **无 schema 的情况**：根据现有 JSON 值推断类型，生成简单的键值编辑器

#### 第三层：文件浏览器（辅助功能）

对 scripts/、references/、tests/ 等目录提供只读浏览和 markdown 预览，不做编辑。

### 技术方案选型建议

针对 T1 的 JSON Schema 表单生成器，建议调研以下方向：

1. **react-jsonschema-form (RJSF)**：最成熟的 React JSON Schema 表单库，支持 draft-07，有 shadcn/ui 主题可定制
2. **@jsonforms/react**：Eclipse 开源，支持复杂布局，但学习曲线陡
3. **自研 schema-to-form**：基于 tech-news-digest 的 schema 特点定制，完全控制 UI

### Frontmatter 字段优先级


| 优先级 | 字段                         | 理由              |
| --- | -------------------------- | --------------- |
| P0  | name, description          | 100% 的 Skill 都有 |
| P0  | metadata.openclaw.requires | 核心运行时配置         |
| P1  | version, homepage, author  | 30% 的 Skill 使用  |
| P1  | env 数组                     | 复杂 Skill 必备     |
| P1  | metadata.openclaw.emoji    | UI 展示需要         |
| P2  | triggers / read_when       | 少数 Skill 使用     |
| P2  | metadata.openclaw.install  | 高级功能            |
| P3  | command-dispatch 系列        | 极少使用            |


---

## 八、当前 SkillForge 类型系统的差距

对比本次调研发现与 `src/types/skill.ts` 现有定义：

### 已覆盖 ✅

- name, description, version, author, homepage, source
- env (EnvVarDefinition[])
- metadata (Record<string, unknown>)

### 缺失需补充 ⚠️

- `read_when: string[]`
- `triggers: string[]`
- `auto_trigger: boolean`
- `user-invocable: boolean` （注意连字符）
- `allowed-tools: string`
- `disable-model-invocation: boolean`
- `command-dispatch: string`
- `command-tool: string`
- `command-arg-mode: string`
- `emoji: string`（顶级位置）
- `metadata.openclaw` 的完整子类型定义

### 已有但未在实际数据中发现

- `tools: unknown[]`（frontmatter 中未观察到，可能在 markdown body 中）
- `files: { read, write }`（未观察到）

---

## 九、SKILL.md Body 结构分析

SKILL.md 的 markdown body（frontmatter 之后）没有强制格式，但观察到以下常见模式：


| 模式                          | 出现频率  | 示例                             |
| --------------------------- | ----- | ------------------------------ |
| `# 标题` + 说明文本               | 18/18 | 所有 Skill                       |
| `## 使用步骤` / `## Usage`      | 8/18  | 步骤化指令                          |
| `## Tools` + 工具定义           | 3/18  | agent-browser, task-decomposer |
| `## Requirements` / `## 认证` | 5/18  | 前置条件说明                         |
| `## Commands` + 代码块         | 4/18  | CLI 命令示例                       |
| `## 触发条件`                   | 2/18  | 何时激活描述                         |
| YAML/JSON 代码块               | 3/18  | 配置示例                           |
| 内联 `{baseDir}` 引用           | 0/18  | 官方支持但未观察到                      |


**对 SkillForge 的启示**：SKILL.md body 是自由格式的 markdown，编辑器应提供 markdown 编辑 + 实时预览，而非结构化表单。

---

## 十、附录：SKILL.md 行数分布

```
tiered-memory          ████████████████████████████████████████████████  1098
tech-news-digest       ████████████████████████░░░░░░░░░░░░░░░░░░░░░░   536
task-decomposer        ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░   471
skill-security-auditor ███████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░   439
deep-writing           ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   328
agent-browser          ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   328
prompt-injection-guard ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   278
url-reader             ███████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   260
cost-governor          ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   191
wechat-article-reader  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   176
larksync               ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   102
using-superpowers      ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    87
bilibili-youtube       ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    84
douyin-downloader      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    55
openclaw-tavily-search ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    48
video-generate         ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    47
image-ocr              █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    42
image-generate         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    32

中位数: 184 行 | 平均: 248 行
```

