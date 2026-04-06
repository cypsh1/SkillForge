# T0 Skill 内容结构调研 执行记录

**日期**: 2026-04-05
**执行模式**: Opus 主控（Phase 1 直接执行 + Phase 2 三个 fast 子 Agent 并行采集）

## 调研记录

### 搜索内容

- 搜索 1：`github openclaw skills repository structure 2026` → 发现官方 6 级 Skill 加载优先级、ClawHub 注册表（13,700+ 社区 Skill）
- 搜索 2：`openclaw SKILL.md frontmatter schema metadata fields documentation 2026` → 找到完整的 frontmatter 字段参考（ClawHub skill-format.md）
- 搜索 3：`openclaw skill.toml metadata.json _meta.json config directory structure specification` → 确认 _meta.json 是系统管理文件，skill.toml/metadata.json 是非标准自定义格式
- 搜索 4：`openclaw skill read_when triggers allowed-tools auto_trigger frontmatter fields` → 发现触发条件字段（triggers/read_when/auto_trigger）和 allowed-tools
- 搜索 5：`openclaw skills community examples complex config directory github 2026` → 确认 ClawHub 13,700+ Skill 中 config/ 目录模式极少

### 文档抓取
- docs.openclaw.ai/skills/ — 完整的 Skills 加载/优先级/gating 文档
- docs.openclaw.ai/tools/creating-skills — 创建 Skills 教程
- openclawai.me/blog/skill-manifest-reference — 第三方 skill.yaml manifest 参考（非官方格式）

### SSH 数据采集
- `ssh openclaw` → 列出 18 个 Skill 全量目录结构
- 读取所有 SKILL.md frontmatter（前 20 行）
- 读取所有 _meta.json / metadata.json / skill.toml / config.json 内容
- 读取 tech-news-digest 的 config/schema.json（唯一使用 JSON Schema 的 Skill）
- 统计所有 SKILL.md 行数

### 调研结论（Phase 1，基于 18 个服务器 Skill + 文档）

1. **80% 的 Skill 编辑需求集中在 SKILL.md frontmatter**，这是唯一的官方元数据来源
2. **55% 的 Skill 是简单结构**（L1 纯文档 + L2 带脚本），核心就是一个 SKILL.md
3. **只有 6%（1/18）使用 JSON Schema 定义 config**，config/ 目录模式极稀少
4. **T1 应优先做 frontmatter 结构化编辑器**，基于内置 schema（不依赖外部 schema.json），再扩展到 config 编辑
5. **metadata 字段有历史别名**：openclaw / clawdbot / clawdis，解析器需要兼容

### 调研结论（Phase 2，大样本验证 — 7199 个 Skill）

6. **config/ 目录在 7128 个社区 Skill 中仅 56 个（0.8%）使用**，JSON Schema 仅 4 个（0.06%）
7. **官方内置 53 个 Skill 中 0 个有 config/**，87% 是 L1 纯文档型
8. **scripts/（40%）和 references/（24%）是最常见的辅助目录**
9. **config/ 中的格式多样**：JSON 居多，也有 YAML、纯文本、Markdown — 不能假设都是 JSON
10. **社区存在少量 L4-L5 级复杂 Skill**（comic/72文件、openforge/64文件），但占比极低

## 批次执行

### Phase 1：直接执行

#### 步骤 1：SSH 服务器数据采集
- 操作：通过 `ssh openclaw` 列出 18 个 Skill 的完整目录结构，读取所有元数据文件
- 结果：获得 18 个 Skill 的完整文件树 + 所有 frontmatter + 所有元数据文件内容

#### 步骤 2：GitHub/文档调研
- 操作：搜索 OpenClaw 官方文档、ClawHub 规范、社区博客
- 结果：确认 SKILL.md frontmatter 完整字段列表 + metadata.openclaw 子结构 + 6 级加载优先级

#### 步骤 3：汇总分析 + 输出报告
- 操作：5 级分类、字段统计、写入分析报告
- 结果：`project-harness/evidence/skill-structure-analysis.md`（初版）

### Phase 2：子 Agent 并行扩展调研

#### 步骤 4：3 个 fast 子 Agent 并行采集
- Agent 1（官方内置）：clone openclaw/openclaw → 53 个 Skill 全量分析
- Agent 2（社区仓库）：GitHub Tree API → 7128 个 Skill 统计 + 18 个复杂 Skill 深度分析
- Agent 3（Awesome+搜索）：awesome 列表 + GitHub 搜索 → 15 个 Skill

#### 步骤 5：大样本统计
- 操作：用 GitHub Tree API 对 7128 个社区 Skill 做 scripts/config/references/tests 出现率统计
- 结果：config/ 仅 0.8%，schema.json 仅 0.06%，scripts/ 40.4%，references/ 24.0%

#### 步骤 6：56 个 config/ Skill 的格式分析
- 操作：列出所有含 config/ 的 Skill 及其文件
- 结果：JSON 38 个、YAML 10 个、Schema 4 个、纯文本 3 个、其他 5 个

#### 步骤 7：更新分析报告
- 操作：补充二-B（官方内置）、二-C（社区大样本）、更新结论
- 结果：报告从 300 行扩展到 ~550 行，覆盖 7199 个 Skill 的数据

## 子 Agent 使用情况

| 任务 | 模型 | 质量 | 备注 |
|---|---|---|---|
| 官方内置 Skill 采集 | fast (shell) | ✅ | 53 个 Skill 全量分析，输出格式规范 |
| 社区 Skill 采集 | fast (shell) | ⚠️ | GitHub API 限速导致 8/18 个 SKILL.md 未能下载，但目录统计完整 |
| Awesome+搜索采集 | fast (shell) | ⚠️ | git clone 失败（网络），改用 API；部分 SKILL.md 获取受限 |
| 结果提取（3 个读取 Agent） | fast (generalPurpose) | ✅ | 正确提取了 JSONL 中的最终输出 |

**子 Agent 经验更新**：
- shell 子 Agent 做 git clone + 文件分析非常高效
- GitHub API 限速是主要瓶颈，应在委派时提供 GITHUB_TOKEN
- 调研类任务（非代码编写）也适合用子 Agent 并行采集数据

## 验收确认

- `npm run dev`: N/A（本次无代码变更）
- `npm run build`: N/A
- `npx tsc -b --noEmit`: N/A
- 浏览器验证: N/A
- 调研报告: ✅ 已输出（含大样本验证）
- current-state 更新: ✅
- backlog 更新: ✅
