---
name: tech-news-digest-cn
description: 生成科技新闻摘要，具有统一的数据源模型、质量评分和多格式输出。六源数据收集包括 RSS 源、Twitter/X 关键意见领袖、GitHub 发布、GitHub 趋势、Reddit 和网页搜索。基于管道的脚本具有重试机制和去重功能。支持 Discord、电子邮件和 Markdown 模板。
version: 3.16.0
homepage: https://github.com/draco-agent/tech-news-digest
source: https://github.com/draco-agent/tech-news-digest
metadata:
  openclaw:
    requires:
      bins:
        - python3
    optionalBins:
      - mail
      - msmtp
      - gog
      - gh
      - openssl
      - weasyprint
env:
  - name: TWITTER_API_BACKEND
    required: false
    description: "Twitter API 后端：'official'、'twitterapiio' 或 'auto'（默认：auto）"
  - name: X_BEARER_TOKEN
    required: false
    description: Twitter/X API 访问令牌，用于关键意见领袖监控（官方后端）
  - name: TWITTERAPI_IO_KEY
    required: false
    description: twitterapi.io API 密钥，用于关键意见领袖监控（twitterapiio 后端）
  - name: TAVILY_API_KEY
    required: false
    description: Tavily 搜索 API 密钥（Brave 的替代方案）
  - name: WEB_SEARCH_BACKEND
    required: false
    description: "网页搜索后端：auto（默认）、brave 或 tavily"
  - name: BRAVE_API_KEYS
    required: false
    description: Brave 搜索 API 密钥（逗号分隔，用于轮换）
  - name: BRAVE_API_KEY
    required: false
    description: Brave 搜索 API 密钥（单个密钥备用）
  - name: GITHUB_TOKEN
    required: false
    description: GitHub 令牌，用于提高 API 速率限制（如果未设置，从 GitHub App 自动生成）
  - name: GH_APP_ID
    required: false
    description: GitHub App ID，用于自动生成安装令牌
  - name: GH_APP_INSTALL_ID
    required: false
    description: GitHub App 安装 ID，用于自动生成令牌
  - name: GH_APP_KEY_FILE
    required: false
    description: GitHub App 私钥 PEM 文件路径
tools:
  - python3: 必需。运行数据收集和合并脚本。
  - mail: 可选。基于 msmtp 的邮件命令，用于电子邮件传送（首选）。
  - gog: 可选。Gmail CLI，用于电子邮件传送（如果 mail 不可用，作为备用）。
files:
  read:
    - config/defaults/: 默认源和主题配置
    - references/: 提示模板和输出模板
    - scripts/: Python 管道脚本
    - <workspace>/archive/tech-news-digest/: 用于去重的先前摘要
  write:
    - /tmp/td-*.json: 临时管道中间输出
    - /tmp/td-email.html: 临时电子邮件 HTML 正文
    - /tmp/td-digest.pdf: 生成的 PDF 摘要
    - <workspace>/archive/tech-news-digest/: 保存的摘要存档
---

# 科技新闻摘要 (Tech News Digest)

具有统一数据源模型、质量评分管道和基于模板的输出生成的自动化科技新闻摘要系统。

## 快速开始

1. **配置设置**：默认配置位于 `config/defaults/`。复制到工作区以自定义：
   ```bash
   mkdir -p workspace/config
   cp config/defaults/sources.json workspace/config/tech-news-digest-sources.json
   cp config/defaults/topics.json workspace/config/tech-news-digest-topics.json
   ```

2. **环境变量**：
   - `TWITTERAPI_IO_KEY` - twitterapi.io API 密钥（可选，首选）
   - `X_BEARER_TOKEN` - Twitter/X 官方 API 访问令牌（可选，备用）
   - `TAVILY_API_KEY` - Tavily 搜索 API 密钥，Brave 的替代方案（可选）
   - `WEB_SEARCH_BACKEND` - 网页搜索后端：auto|brave|tavily（可选，默认：auto）
   - `BRAVE_API_KEYS` - Brave 搜索 API 密钥，逗号分隔，用于轮换（可选）
   - `BRAVE_API_KEY` - 单个 Brave 密钥备用（可选）
   - `GITHUB_TOKEN` - GitHub 个人访问令牌（可选，改善速率限制）

3. **生成摘要**：
   ```bash
   # 统一管道（推荐）— 并行运行所有 6 个源 + 合并
   python3 scripts/run-pipeline.py \
     --defaults config/defaults \
     --config workspace/config \
     --hours 48 --freshness pd \
     --archive-dir workspace/archive/tech-news-digest/ \
     --output /tmp/td-merged.json --verbose --force
   ```

4. **使用模板**：将 Discord、电子邮件或 PDF 模板应用到合并的输出

## 配置文件

### `sources.json` - 统一数据源
```json
{
  "sources": [
    {
      "id": "openai-rss",
      "type": "rss",
      "name": "OpenAI 博客",
      "url": "https://openai.com/blog/rss.xml",
      "enabled": true,
      "priority": true,
      "topics": ["llm", "ai-agent"],
      "note": "OpenAI 官方更新"
    },
    {
      "id": "sama-twitter",
      "type": "twitter",
      "name": "Sam Altman",
      "handle": "sama",
      "enabled": true,
      "priority": true,
      "topics": ["llm", "frontier-tech"],
      "note": "OpenAI CEO"
    }
  ]
}
```

### `topics.json` - 增强型主题定义
```json
{
  "topics": [
    {
      "id": "llm",
      "emoji": "🧠",
      "label": "大模型 / LLM",
      "description": "大语言模型、基础模型、突破性进展",
      "search": {
        "queries": ["LLM 最新新闻", "大语言模型突破"],
        "must_include": ["LLM", "大语言模型", "基础模型"],
        "exclude": ["教程", "初学者指南"]
      },
      "display": {
        "max_items": 8,
        "style": "detailed"
      }
    }
  ]
}
```

## 脚本管道

### `run-pipeline.py` - 统一管道（推荐）
```bash
python3 scripts/run-pipeline.py \
  --defaults config/defaults [--config CONFIG_DIR] \
  --hours 48 --freshness pd \
  --archive-dir workspace/archive/tech-news-digest/ \
  --output /tmp/td-merged.json --verbose --force
```
- **功能**：并行运行所有 6 个获取步骤，然后合并 + 去重 + 评分
- **输出**：最终合并的 JSON，准备用于报告生成（总耗时 ~30 秒）
- **元数据**：将每个步骤的计时和计数保存到 `*.meta.json`
- **GitHub 认证**：如果未设置 `$GITHUB_TOKEN`，从 GitHub App 自动生成令牌
- **备用**：如果此操作失败，运行下面的单个脚本

### 单个脚本（备用）

#### `fetch-rss.py` - RSS 源获取器
```bash
python3 scripts/fetch-rss.py [--defaults DIR] [--config DIR] [--hours 48] [--output FILE] [--verbose]
```
- 并行获取（10 个工作线程）、指数退避重试、feedparser + 正则表达式备用
- 超时：每个源 30 秒，ETag/Last-Modified 缓存

#### `fetch-twitter.py` - Twitter/X 关键意见领袖监控
```bash
python3 scripts/fetch-twitter.py [--defaults DIR] [--config DIR] [--hours 48] [--output FILE] [--backend auto|official|twitterapiio]
```
- 后端自动检测：如果设置了 `TWITTERAPI_IO_KEY` 则使用 twitterapi.io，否则使用官方 X API v2
- 速率限制处理、参与度指标、指数退避重试

#### `fetch-web.py` - 网页搜索引擎
```bash
python3 scripts/fetch-web.py [--defaults DIR] [--config DIR] [--freshness pd] [--output FILE]
```
- 自动检测 Brave API 速率限制：付费计划 → 并行查询，免费 → 顺序查询
- 无 API：为代理生成搜索界面

#### `fetch-github.py` - GitHub 发布监控
```bash
python3 scripts/fetch-github.py [--defaults DIR] [--config DIR] [--hours 168] [--output FILE]
```
- 并行获取（10 个工作线程），30 秒超时
- 认证优先级：`$GITHUB_TOKEN` → GitHub App 自动生成 → `gh` CLI → 未认证（60 请求/小时）

#### `fetch-github.py --trending` - GitHub 趋势仓库
```bash
python3 scripts/fetch-github.py --trending [--hours 48] [--output FILE] [--verbose]
```
- 跨 4 个主题搜索 GitHub API 中的趋势仓库（大模型、AI 代理、加密货币、前沿技术）
- 质量评分：基础 5 + 日星数估计 / 10，最高 15

#### `fetch-reddit.py` - Reddit 帖子获取器
```bash
python3 scripts/fetch-reddit.py [--defaults DIR] [--config DIR] [--hours 48] [--output FILE]
```
- 并行获取（4 个工作线程），公开 JSON API（无需认证）
- 13 个子版块，分数过滤

#### `enrich-articles.py` - 文章全文富化
```bash
python3 scripts/enrich-articles.py --input merged.json --output enriched.json [--min-score 10] [--max-articles 15] [--verbose]
```
- 获取高评分文章的全文
- Cloudflare Markdown for Agents（首选）→ HTML 提取（备用）→ 跳过（付费墙/社交媒体/视频）
- 博客域名白名单，较低评分阈值（≥3）
- 并行获取（5 个工作线程，10 秒超时）

#### `merge-sources.py` - 质量评分与去重
```bash
python3 scripts/merge-sources.py --rss FILE --twitter FILE --web FILE --github FILE --reddit FILE
```
- 质量评分、标题相似度去重（85%）、先前摘要惩罚
- 输出：按主题分组的文章，按评分排序

#### `validate-config.py` - 配置验证器
```bash
python3 scripts/validate-config.py [--defaults DIR] [--config DIR] [--verbose]
```
- JSON schema 验证、主题引用检查、重复 ID 检测

#### `generate-pdf.py` - PDF 报告生成器
```bash
python3 scripts/generate-pdf.py --input report.md --output digest.pdf [--verbose]
```
- 将 Markdown 摘要转换为具有中文排版的样式化 A4 PDF（Noto Sans CJK SC）
- 表情符号图标、页眉/页脚、蓝色强调主题。需要 `weasyprint`。

#### `sanitize-html.py` - 安全 HTML 电子邮件转换器
```bash
python3 scripts/sanitize-html.py --input report.md --output email.html [--verbose]
```
- 将 Markdown 转换为 XSS 安全的 HTML 电子邮件，内联 CSS
- URL 白名单（仅 http/https），HTML 转义文本内容

#### `source-health.py` - 源健康监控
```bash
python3 scripts/source-health.py --rss FILE --twitter FILE --github FILE --reddit FILE --web FILE [--verbose]
```
- 跟踪 7 天内的每个源成功/失败历史
- 报告不健康的源（>50% 失败率）

#### `summarize-merged.py` - 合并数据摘要
```bash
python3 scripts/summarize-merged.py --input merged.json [--top N] [--topic TOPIC]
```
- 合并数据的人类可读摘要，用于 LLM 消费
- 显示每个主题的热门文章，包含评分和指标

## 用户自定义

### 工作区配置覆盖
在 `workspace/config/` 中放置自定义配置以覆盖默认值：

- **源**：附加新源，使用 `"enabled": false` 禁用默认源
- **主题**：覆盖主题定义、搜索查询、显示设置
- **合并逻辑**：
  - 同一 `id` 的源 → 用户版本优先
  - 新 `id` 的源 → 附加到默认值
  - 同一 `id` 的主题 → 用户版本完全替换默认值

### 工作区覆盖示例
```json
// workspace/config/tech-news-digest-sources.json
{
  "sources": [
    {
      "id": "simonwillison-rss",
      "enabled": false,
      "note": "禁用：对我的使用案例来说太嘈杂"
    },
    {
      "id": "my-custom-blog",
      "type": "rss",
      "name": "我的自定义技术博客",
      "url": "https://myblog.com/rss",
      "enabled": true,
      "priority": true,
      "topics": ["frontier-tech"]
    }
  ]
}
```

## 模板与输出

### Discord 模板 (`references/templates/discord.md`)
- 项目列表格式，链接抑制（`<link>`）
- 移动优化，表情符号标题
- 2000 字符限制意识

### 电子邮件模板 (`references/templates/email.md`)
- 丰富元数据、技术统计、存档链接
- 执行摘要、热门文章部分
- HTML 兼容格式

### PDF 模板 (`references/templates/pdf.md`)
- A4 页面布局，Noto Sans CJK SC 字体中文支持
- 表情符号图标、带页码的页眉/页脚
- 通过 `scripts/generate-pdf.py` 生成（需要 `weasyprint`）

## 默认源（共 151 个）

- **RSS 源（62 个）**：AI 实验室、技术博客、加密新闻、中国科技媒体
- **Twitter/X 关键意见领袖（48 个）**：AI 研究员、加密领导者、技术高管
- **GitHub 仓库（28 个）**：主要开源项目（LangChain、vLLM、DeepSeek、Llama 等）
- **Reddit（13 个）**：r/MachineLearning、r/LocalLLaMA、r/CryptoCurrency、r/ChatGPT、r/OpenAI 等
- **网页搜索（4 个主题）**：大模型、AI 代理、加密货币、前沿技术

所有源均预配置了适当的主题标签和优先级。

## 依赖项

```bash
pip install -r requirements.txt
```

**可选但推荐**：
- `feedparser>=6.0.0` - 更好的 RSS 解析（如果不可用，回退到正则表达式）
- `jsonschema>=4.0.0` - 配置验证

**所有脚本使用 Python 3.8+ 标准库即可正常工作。**

## 监控与操作

### 健康检查
```bash
# 验证配置
python3 scripts/validate-config.py --verbose

# 测试 RSS 源
python3 scripts/fetch-rss.py --hours 1 --verbose

# 检查 Twitter API
python3 scripts/fetch-twitter.py --hours 1 --verbose
```

### 存档管理
- 摘要自动存档到 `<workspace>/archive/tech-news-digest/`
- 先前摘要标题用于重复检测
- 旧存档自动清理（90 天以上）

### 错误处理
- **网络故障**：使用指数退避重试
- **速率限制**：自动使用适当的延迟重试
- **无效内容**：优雅降级，详细日志记录
- **配置错误**：带有有用消息的 schema 验证

## API 密钥与环境

在 `~/.zshenv` 或类似文件中设置：
```bash
# Twitter（至少需要一个用于 Twitter 源）
export TWITTERAPI_IO_KEY="your_key"        # twitterapi.io 密钥（首选）
export X_BEARER_TOKEN="your_bearer_token"  # 官方 X API v2（备用）
export TWITTER_API_BACKEND="auto"          # auto|twitterapiio|official（默认：auto）

# 网页搜索（可选，启用网页搜索层）
export WEB_SEARCH_BACKEND="auto"          # auto|brave|tavily（默认：auto）
export TAVILY_API_KEY="tvly-xxx"           # Tavily 搜索 API（免费 1000/月）

# Brave 搜索（替代方案）
export BRAVE_API_KEYS="key1,key2,key3"     # 多个密钥，逗号分隔轮换
export BRAVE_API_KEY="key1"                # 单个密钥备用
export BRAVE_PLAN="free"                   # 覆盖速率限制检测：free|pro

# GitHub（可选，改善速率限制）
export GITHUB_TOKEN="ghp_xxx"              # PAT（最简单）
export GH_APP_ID="12345"                   # 或使用 GitHub App 进行自动令牌生成
export GH_APP_INSTALL_ID="67890"
export GH_APP_KEY_FILE="/path/to/key.pem"
```

- **Twitter**：`TWITTERAPI_IO_KEY` 首选（$3-5/月）；`X_BEARER_TOKEN` 作为备用；`auto` 模式首先尝试 twitterapiio
- **网页搜索**：Tavily（在自动模式下首选）或 Brave；可选，无可用情况下回退到代理 web_search
- **GitHub**：如果未设置 PAT，从 GitHub App 自动生成令牌；未认证备用（60 请求/小时）
- **Reddit**：无需 API 密钥（使用公开 JSON API）

## 计划任务集成

### OpenClaw 计划（推荐）

计划提示**不应**硬编码管道步骤。相反，应参考 `references/digest-prompt.md`，仅传递配置参数。这确保管道逻辑保留在技能库中，所有安装中保持一致。

#### 每日摘要计划提示
```
读取 <SKILL_DIR>/references/digest-prompt.md 并按照完整工作流生成每日摘要。

替换占位符为：
- MODE = daily
- TIME_WINDOW = 过去 1-2 天
- FRESHNESS = pd
- RSS_HOURS = 48
- ITEMS_PER_SECTION = 3-5
- ENRICH = true
- BLOG_PICKS_COUNT = 3
- EXTRA_SECTIONS = （无）
- SUBJECT = 每日科技摘要 - YYYY-MM-DD
- WORKSPACE = <你的工作区路径>
- SKILL_DIR = <你的技能安装路径>
- DISCORD_CHANNEL_ID = <你的频道 id>
- EMAIL = （可选）
- LANGUAGE = 中文
- TEMPLATE = discord

严格按照提示模板中的每一步进行。不要跳过任何步骤。
```

#### 每周摘要计划提示
```
读取 <SKILL_DIR>/references/digest-prompt.md 并按照完整工作流生成每周摘要。

替换占位符为：
- MODE = weekly
- TIME_WINDOW = 过去 7 天
- FRESHNESS = pw
- RSS_HOURS = 168
- ITEMS_PER_SECTION = 10-15
- ENRICH = true
- BLOG_PICKS_COUNT = 3-5
- EXTRA_SECTIONS = 📊 每周趋势摘要（2-3 句话总结宏观趋势）
- SUBJECT = 每周科技摘要 - YYYY-MM-DD
- WORKSPACE = <你的工作区路径>
- SKILL_DIR = <你的技能安装路径>
- DISCORD_CHANNEL_ID = <你的频道 id>
- EMAIL = （可选）
- LANGUAGE = 中文
- TEMPLATE = discord

严格按照提示模板中的每一步进行。不要跳过任何步骤。
```

#### 为什么采用这种模式？
- **单一信息源**：管道逻辑存在于 `digest-prompt.md` 中，而不是分散在计划配置中
- **便携式**：同一技能在不同 OpenClaw 实例上，仅更改路径和频道 ID
- **可维护**：更新技能 → 所有计划自动获取更改
- **反模式**：不要将管道步骤复制到计划提示中 — 它会与源不同步

#### 多通道传送限制
OpenClaw 强制执行**跨提供商隔离**：单个会话只能向一个提供商发送消息（例如 Discord 或 Telegram，不是两者）。如果需要向多个平台传送摘要，为每个提供商创建**单独的计划任务**：

```
# 任务 1：Discord + 电子邮件
- DISCORD_CHANNEL_ID = <你的 discord 频道 id>
- EMAIL = user@example.com
- TEMPLATE = discord

# 任务 2：Telegram DM
- DISCORD_CHANNEL_ID = （无）
- EMAIL = （无）
- TEMPLATE = telegram
```
在第二个任务的提示中用目标平台的传送替换 `DISCORD_CHANNEL_ID`。

这是一个安全功能，而不是一个 bug — 它可以防止意外的跨上下文数据泄露。

## 安全说明

### 执行模型
此技能使用**提示模板模式**：代理读取 `digest-prompt.md` 并按照其说明进行。这是标准的 OpenClaw 技能执行模型 — 代理解释技能提供的文件中的结构化说明。所有说明均与技能捆绑一起，可在安装前进行审核。

### 网络访问
Python 脚本向以下位置进行出站请求：
- RSS 源 URL（在 `tech-news-digest-sources.json` 中配置）
- Twitter/X API（`api.x.com` 或 `api.twitterapi.io`）
- Brave 搜索 API（`api.search.brave.com`）
- Tavily 搜索 API（`api.tavily.com`）
- GitHub API（`api.github.com`）
- Reddit JSON API（`reddit.com`）

没有数据发送到任何其他端点。所有 API 密钥从技能元数据中声明的环境变量中读取。

### Shell 安全性
电子邮件传送使用 `send-email.py`，它构造正确的 MIME 多部分消息，带有 HTML 正文和可选 PDF 附件。主题格式是硬编码的（`每日科技摘要 - YYYY-MM-DD`）。PDF 生成通过 `generate-pdf.py` 使用 `weasyprint`。提示模板明确禁止将不受信任的内容（文章标题、推文文本等）插入到 shell 参数中。电子邮件地址和主题必须是静态占位符值。

### 文件访问
脚本从 `config/` 读取，写入 `workspace/archive/`。工作区外没有文件被访问。

## 支持与故障排除

### 常见问题
1. **RSS 源故障**：检查网络连接，使用 `--verbose` 获取详细信息
2. **Twitter 速率限制**：减少源或增加间隔
3. **配置错误**：运行 `validate-config.py` 了解具体问题
4. **未找到文章**：检查时间窗口（`--hours`）和源启用状态

### 调试模式
所有脚本都支持 `--verbose` 标志，用于详细日志记录和故障排除。

### 性能调整
- **并行工作线程**：调整脚本中的 `MAX_WORKERS` 以适应你的系统
- **超时设置**：为缓慢的网络增加 `TIMEOUT`
- **文章限制**：根据需要调整 `MAX_ARTICLES_PER_FEED`

## 安全考虑

### Shell 执行
摘要提示指示代理通过 shell 命令运行 Python 脚本。所有脚本路径和参数都是技能定义的常量 — 没有用户输入被插入到命令中。两个脚本使用 `subprocess`：
- `run-pipeline.py` 编排子获取脚本（所有在 `scripts/` 目录内）
- `fetch-github.py` 有两个 subprocess 调用：
  1. `openssl dgst -sha256 -sign`，用于 JWT 签名（仅当设置了 `GH_APP_*` 环境变量时 — 签署自构建的 JWT 有效负载，无用户内容涉及）
  2. `gh auth token` CLI 备用（仅当安装了 `gh` 时 — 从 gh 自己的凭证存储读取）

用户提供或获取的内容永远不会被插入到 subprocess 参数中。电子邮件传送使用 `send-email.py`，它以编程方式构建 MIME 消息 — 没有 shell 插值。PDF 生成通过 `generate-pdf.py` 使用 `weasyprint`。电子邮件主题是静态格式字符串 — 永远不会从获取的数据构建。

### 凭证与文件访问
脚本**不**直接读取 `~/.config/`、`~/.ssh/` 或任何凭证文件。所有 API 令牌都从技能元数据中声明的环境变量中读取。GitHub 认证级联是：
1. `$GITHUB_TOKEN` 环境变量（你控制要提供的内容）
2. GitHub App 令牌生成（仅当你设置了 `GH_APP_ID`、`GH_APP_INSTALL_ID` 和 `GH_APP_KEY_FILE` 时 — 通过 `openssl` CLI 使用内联 JWT 签名，没有外部脚本被执行）
3. `gh auth token` CLI（委托给 gh 自己的安全凭证存储）
4. 未认证（60 请求/小时，安全备用）

如果你更倾向于不进行自动凭证发现，只需设置 `$GITHUB_TOKEN`，脚本将直接使用它，不尝试步骤 2-3。

### 依赖项安装
此技能**不**安装任何包。`requirements.txt` 仅出于参考目的列出可选依赖项（`feedparser`、`jsonschema`）。所有脚本都使用 Python 3.8+ 标准库。用户应在 virtualenv 中安装可选依赖项（如果需要）— 技能永远不会运行 `pip install`。

### 输入清理
- URL 解析拒绝非 HTTP(S) 方案（javascript:、data: 等）
- RSS 备用解析使用简单的非回溯正则表达式模式（无 ReDoS 风险）
- 所有获取的内容都被视为不受信任的数据，仅用于显示
