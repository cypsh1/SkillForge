---

## description: 任务待办清单（唯一的任务管理文件）

status: active
last_updated: 2026-04-09

# Backlog

> 所有待办、进行中、已完成的任务统一管理在此文件。
> AI 每次对话收尾时必须更新本文件。

## ID 命名规则

- **V1-N**：V1.0 活跃任务（数字 = 执行顺序）
- **V1-BUG**：V1.0 Bug 修复批次
- **V1-UX**：V1.0 发布前 UX 优化
- **历史 ID**（Phase/D/T/Batch/F/P 等）：已完成任务保持原 ID 不改
- **P-N**（带横杠）：流程改进讨论项（非执行任务）

## 当前任务

**（无）** — 请从下方「V1.1 待办」或产品路线图中选择下一项，并将本段标题改为所选任务 ID + 名称。

---

## 最近完成

**V1.1-TRIGGER-FIX：触发条件虚假默认值修复** ✅ 2026-04-11

来源：用户发现触发条件区块显示 9 行字段，大部分是代码默认值而非真实配置，且编辑面板与预览面板数据不一致。

### 改动

- TriggerDisplay：只渲染 frontmatter 中实际存在的字段；无配置时显示"未配置触发条件"
- saveTrigger：`user-invocable` 不再无条件写回，仅在原本存在或用户明确修改时写入
- i18n：新增 `form.trigger.empty` 中英文 key
- Harness：执行策略新增 L7"数据真实性"规则
- Memory：新增 `feedback_data_truthfulness.md` 跨会话记忆

### 验收标准

- [x] 无触发配置的 Skill（如 tech-news-digest）：编辑面板显示"未配置触发条件"，预览面板同为空
- [x] 有触发配置的 Skill（如 Agent Browser）：只显示已配置的字段（read_when + allowed-tools），左右一致
- [x] 编辑后保存不会在文件中新增原本不存在的默认字段
- [x] tsc ✅ build ✅

---

**V1.1-STYLE-UNIFY：跨文件类型展示与编辑一致性** ✅ 2026-04-10

来源：用户排查发现 config 文件的编辑和预览面板与 SKILL.md 风格不一致。

### 执行计划

| Phase | 名称 | 内容 | 状态 |
|---|---|---|---|
| A | 编辑面板容器统一 | SourcesEditor/TopicsEditor 重构为 SectionBlock 包裹 + 展示/编辑切换 + draft 模式；ConfigFileEditor Card 错误态改简文本 | ✅ |
| B | 预览面板结构化 + 桥线联动 | config 预览从 JsonPreview 升级为 SourcesPreview/TopicsPreview/SchemaJsonPreview + sectionId 桥线 | ✅ |
| C | 清理 + 嵌套 JSON 修复 | 删除 5 个废弃文件（-632 行）；JsonFileEditor 嵌套对象/数组显示+编辑+保存修复 | ✅ |

### 验收标准

- [x] config 文件编辑面板有彩色左边框、折叠按钮，与 SKILL.md 风格统一
- [x] config 文件预览面板有结构化分段，不再是原始 JSON 文本
- [x] 左右面板桥线联动对 config 文件生效（跳转、折叠同步）
- [x] 嵌套 JSON 编辑不丢失数据
- [x] 废弃旧页面代码已清理
- [x] tsc ✅ build ✅

---

**V1.1-SCHEMA-EDIT：schema.json 可编辑** ✅ 2026-04-10

来源：用户排查发现 config-file 类型的 schema.json 路由到只读 SchemaViewer，无法编辑。

### 改动

| 批次 | 内容 | 涉及文件 | 状态 |
|---|---|---|---|
| S1 | 新增 SchemaRawEditor（SectionBlock + textarea 编辑 + JSON parse 校验） | editor-panel.tsx | ✅ |
| S2 | ConfigFileEditor schema case 改用 SchemaRawEditor（传入 onChange） | editor-panel.tsx | ✅ |
| S3 | i18n 补齐 `workspace.file.schema` key | zh.json, en.json | ✅ |

### 验收标准

- [x] schema.json 展示态保持 SchemaViewer 格式化表格
- [x] 点击"编辑"切换为 textarea 显示完整 JSON 原文
- [x] JSON 语法错误时就地提示 parse error
- [x] "完成"后通过 updateConfig 写回编辑状态
- [x] `npx tsc -b --noEmit` ✅
- [x] `npm run build` ✅
- [x] 浏览器验证 ✅

---

**V1.1-DATA：测试数据全量同步 + 文件加载器重构** ✅ 2026-04-09

来源：V1.1-UNIFIED 验收后发现大部分 Skill 测试数据不完整（多数只有 SKILL.md），导致编辑/预览内容不一致。

### 批次计划

| 批次 | 内容 | 涉及文件 | 状态 |
|---|---|---|---|
| S1 | rsync 从服务器全量同步测试数据（排除 \_\_pycache\_\_/\*.pyc/\*.bak） | src/data/test-skills/ | ✅ |
| S2 | 重构 skill-loader.ts：手动 import → import.meta.glob 自动发现 | src/data/skill-loader.ts | ✅ |
| S3 | 补齐 tauri-fs.ts：loadLocalSkills() 加载 extra files | src/lib/tauri-fs.ts | ✅ |
| S4 | 全流程验证（tsc + build；浏览器由人工或后续会话补验） | — | ✅ |

### 验收标准

- [x] 本地 test-skills 包含服务器全部 18 个 Skill 的完整文件（另保留本地-only：`tech-news-digest-cn`，共 19 个目录）
- [x] skill-loader.ts 使用 import.meta.glob，新增/删除文件零代码改动
- [x] 开发模式下 `loadTestSkills()` 覆盖全部 Skill 目录与 glob 命中文件（与磁盘一致）
- [x] tauri-fs.ts `loadLocalSkills()` 加载 extra files（扩展名与 skill-loader 一致：md/json/py/sh/js/txt/toml；跳过 SKILL.md 与 `config/`）
- [x] `npx tsc -b --noEmit` ✅
- [x] `npm run build` ✅

**说明**：`skill-loader` 打包 chunk 因嵌入全部测试资源增至约 922KB（gzip ~254KB），属预期 trade-off。

---

**V1.1-UNIFIED：Markdown 正文统一 + 文件渲染对齐（第 1-2 期）** ✅ 2026-04-09

来源：[文件处理优化方案](c1ad2ae3-97a7-4f15-acf4-ecaf11131b03) + [评审细化](bedbb61a-3268-4076-a7b2-a0fccdb79a06)

### 批次计划

| 批次 | 内容 | 涉及文件 | 状态 |
|---|---|---|---|
| B1 | 底座：类型 + 解析器 + 状态管理 + 序列化 | types/skill.ts, types/workspace.ts, skill-parser.ts, use-workspace.ts, skill-serializer.ts | ✅ |
| B2 | 编辑面板 doc/exec 替换为 FragmentBlock | editor-panel.tsx | ✅ |
| B3 | 预览面板 + 保存链路修复 | inspector-panel.tsx | ✅ |
| B4 | 区块容器合并 + 非 .md 预览补齐 (2a+2b) | 新 section-block.tsx, extra-file-editors.tsx, editor-panel.tsx, inspector-panel.tsx | ✅ |
| B5 | SKILL.md 四分类路由 (2c) | editor-panel.tsx, inspector-panel.tsx, zh.json, en.json | ✅ |

### 验收标准

- [x] SKILL.md doc/exec 区块显示富文本（表格/代码/列表），可逐段编辑
- [x] 编辑 doc 段落后，预览实时同步，保存包含修改
- [x] 前 6 个 frontmatter 区块完全不受影响
- [x] .py/.sh 预览侧有区块容器
- [x] 无 frontmatter 的 SKILL.md 不显示空区块（蓝色信息横幅 + 纯正文渲染）
- [x] 损坏 frontmatter 的 SKILL.md 显示错误提示 + 正文正常（红色警告横幅 + 原始 frontmatter + 正文渲染）
- [x] `npx tsc -b --noEmit` ✅
- [x] `npm run build` ✅

## V1.0 路线图

> 目标：用户能完整走通"打开 Skill → 编辑 → 保存"的闭环，且体验可接受。
> 产品形态：**V1.0 以本地产品（Tauri 桌面应用）形式发布**，不含账户系统。

### V1.0 剩余任务

| 序号 | ID | 名称 | 状态 |
|---|---|---|---|
| 4 | **V1-4** | 保存流程闭环 | ✅ 完成 |
| 5 | **V1-5** | 代码分割 | ✅ 完成 |
| — | **V1-UX** | 发布前 UX 优化（#18 #19 #4+ #22 #1 #8 完成；#15 #16 推迟 V1.1；#17 已在 V1-1 完成） | ✅ 完成 |

### V1.0 已完成

| ID | 名称 | 完成日期 |
|---|---|---|
| F2+F3 | 区块级编辑 + UI 对齐 | 2026-04-07 |
| V1-1 | 文档正文展开 | 2026-04-07 |
| V1-2 | 技能 CRUD 入口 | 2026-04-07 |
| V1-3 | 其他文件类型适配 | 2026-04-07 |
| V1-BUG | Bug 修复批次（#5 #9 #10 #14） | 2026-04-08 |
| V1-4 | 保存流程闭环 | 2026-04-08 |
| V1-5 | 代码分割 | 2026-04-08 |
| V1-LAYOUT | 布局间距全面优化 | 2026-04-08 |
| V1-UX | 发布前 UX 优化（#18 #19 #4+ #22 #1 #8） | 2026-04-08 |
| V1-UX-FIX | V1-UX 用户反馈修正（图标/分隔线/标题/架构条） | 2026-04-08 |

---

## V1-BUG 修复批次

来源：F2+F3 遗留 + 用户反馈

| # | 问题 | 说明 | 验收 | 状态 |
|---|---|---|---|---|
| 5 | Trigger 展示/编辑内容不一致 | 编辑态显示更多字段（高级字段），展示态隐藏了。展示态应显示所有有值的字段，空值字段可折叠 | 展示态与编辑态字段覆盖范围一致 | ✅ |
| 9 | 编辑控件不支持自适应布局 | 环境变量区块输入框宽度定死，窄屏溢出 | 输入框 `width:100%` + 容器约束，各宽度下不溢出 | ✅ |
| 10 | 工具区块行高偏大 | 视觉密度与其他区块不一致 | 行高与 env/files 等区块对齐 | ✅ |
| 14 | 底部状态栏遮挡编辑/预览区 | 状态栏（context-bar）覆盖在可视化编辑区和源码预览区底部，导致底部内容不可见 | 编辑区和预览区滚动到底时，内容完全可见，不被状态栏遮挡 | ✅ |

---

## V1-UX 发布前 UX 优化

V1-4/V1-5 完成后、发布前执行。

| # | 优先级 | 问题 | 方案 | 验收 |
|---|---|---|---|---|
| 18 | **P1** | 图标尺寸/位置统一优化 | 统一梳理 4 处图标问题：(a) 根节点校验 `ShieldCheck` h-5→size-4 对齐 severity 图标；(b) 桥线区面板联动 SVG 从 h-4→h-5 + 透明度 30%→50%；(c) 源码预览导出按钮 `Download` size-3→size-3.5 + 按钮 h-5→h-6；(d) 全局图标 size 审计，统一为 size-3.5/size-4 两档 | 所有图标视觉一致，可点击图标 ≥ 20px 热区 |
| 19 | **P1** | 区块边界分隔增强 | 为 `[data-bridge-section]` 添加轻量 `box-shadow: 0 1px 2px rgba(0,0,0,.12)` 或底部 `border-bottom: 1px solid rgba(255,255,255,.04)`；预览侧同步。纯 CSS 修改 | 编辑区和预览区的区块之间有清晰但不突兀的视觉分隔 |
| 4+ | **P2** | 根节点内容与标题优化 | (a) 标题从"可视化编辑"改为"技能概览"（`headerSegment` 已返回"概览"，但标题栏仍用通用标题）；(b) 合并原 #4：优化 SkillOverviewPanel 布局/样式；(c) 根节点内容深度重设计留 V1.1 | 根节点标题显示"技能概览"；概览卡片风格与编辑面板一致 |
| 22 | **P2** | 代码文件样式对齐 | 让 json/py/md 的展示/编辑态视觉接近 SKILL.md。**详细方案见下方验收标准** | 6 项改动点全部通过验收 |
| 1 | P3 | 架构条需适配不同页面/Skill | 根据当前 Skill 实际数据动态生成层级，空层不显示（已有 `buildBridgeRelations` 基础）；非 SKILL.md 页面隐藏或简化架构条 | 切换不同 Skill 时架构条层级正确；概览/config 页面无异常 |
| 8 | P3 | i18n 不完整 | 排查 F2+F3 后新增组件（TriggerDisplay、编辑表单、FilesEditForm、V1-1~V1-3 新组件等），补齐 `t()` 调用 | 切换语言后所有功能标签切换正确 |
| 15 | P3 | 子区块标题编辑 + 预览同步 | 点击编辑时子区块标题也进入可编辑状态，修改后右侧源码预览同步更新 | 编辑态下标题可修改；保存后预览区标题同步变化 |
| 16 | P3 | SKILL.md 编辑后校验 | (a) SKILL.md frontmatter 编辑后触发 Zod 校验 + 提示；(b) 其他 MD 文件编辑后基础格式校验 | 编辑无效值时显示行内校验错误；保存前整体校验通过 |
| 17 | P3 | 文档结构区块体验优化 | doc 区块各章节增加展开/收起切换按钮，方便快速浏览和定位 | 每个章节标题旁有展开/收起按钮；点击切换内容显隐；状态独立互不影响 |

---

## 各任务验收标准

### V1-UX #22 代码文件样式对齐

> 分析对话：[代码文件样式分析](f60dbb04-e291-41fd-b2a2-e9e5f2ced978)

**差异根因**：SKILL.md 使用 `BridgeSectionBlock` + `PreviewSectionBlock`（彩色左边框、圆点、bridge-badge、scrollBothToSection、`.pc` 包裹），而 extra-file 使用独立的 `FileSection` + `ExtraFileSourcePreview`（灰色边框、无圆点、tg-pill、无联动、裸 pre）。

**层 1：编辑面板 FileSection 视觉对齐**（extra-file-editors.tsx + index.css）

- [ ] **1a** 删除 `.file-section` 独立 CSS 规则，FileSection 组件改为输出与 BridgeSectionBlock 相同的 className 结构（不再输出 `file-section` class）
- [ ] **1b** 为 extra-file 区块分配中性主题色 `#64748b`（slate），FileSection 新增 `color` prop，渲染 `[data-bridge-section]` 时设置 `border-left-color`
- [ ] **1c** FileSection 标题行补齐 `<span className="bridge-section-dot" style={{ backgroundColor: color }} />`
- [ ] **1d** 徽章从 `tg-pill` 改为 `bridge-badge`
- [ ] **1e** FileSection header 的 `onClick` 加上 `api?.scrollBothToSection(sectionId)`

**层 2：预览面板对齐**（inspector-panel.tsx）

- [ ] **2a** ExtraFileSourcePreview 每个 section 补齐 `bridge-section-dot`（中性色）
- [ ] **2b** 每个 section 内容用 `.pc` 包裹（获得与 SKILL.md 预览一致的字号/行高/间距）
- [ ] **2c** section header 的 `onClick` 添加 `scrollBothToSection`（caret 单独 stopPropagation 切折叠）
- [ ] **2d** 徽章从 `tg-pill` 改为 `bridge-badge`

**涉及文件**：
- `src/components/workspace/extra-file-editors.tsx` — FileSection 组件
- `src/components/workspace/inspector-panel.tsx` — ExtraFileSourcePreview 组件
- `src/index.css` — 删除 `.file-section` 规则

**不在范围**（V1.1）：
- 实体注入（data-eid、关系指示器）
- 架构层暗化（dimmed）
- 字段级精确联动（左侧字段 hover 高亮右侧代码行）

**最终验收**：
- [ ] extra-file 编辑面板区块有中性色左边框 + 圆点 + bridge-badge，视觉上与 SKILL.md 区块风格统一
- [ ] extra-file 预览面板区块有圆点 + `.pc` 包裹 + bridge-badge，与 SKILL.md 预览风格统一
- [ ] 标题点击触发双面板跳转，caret 点击触发折叠
- [ ] tsc ✅ build ✅

### V1-4 保存流程闭环（已完成）

**验收清单**：
- [x] 编辑后自动出现琥珀色"已修改"徽章
- [x] Tauri 端：保存按钮可见，点击写回文件系统
- [x] 保存成功：toast 提示（2s）+ 徽章消失 + 按钮状态恢复
- [x] 保存失败：红色 toast + 按钮恢复可点击
- [x] Web 端：保存按钮不可见或降级为"导出"
- [x] tsc ✅ build ✅

### V1-5 代码分割（已完成）

**验收清单**：
- [x] React.lazy + Suspense 拆分路由级组件
- [x] 首屏 JS < 300KB
- [x] 所有功能正常（切换 Skill、编辑、保存）
- [x] tsc ✅ build ✅

---

## V1.1 待办

| ID | 名称 | 来源 | 说明 |
|---|---|---|---|
| V1.1-向导 | 创建向导整合 | #2 | 4 模板合并为单入口 + 可选"从模板预填"，减少用户困惑 |
| V1.1-子节点删除 | 子节点删除支持 | #3 | 目录子节点（config 文件等）支持删除 |
| V1.1-文档编辑 | 文档结构可编辑 | #6 | doc/exec 区块从只读变为可编辑（涉及 markdown body 解析→修改→序列化闭环） |
| V1.1-配色 | 配色方案优化 | #7 | 两个方向待选：优化彩色 / 深紫主题。需先在 demo 中验证，再实施 |
| V1.1-修改追踪 | 修改追踪增强 | #11 | 记录修改数量/位置/筛选（当前仅有 dirty 标记） |
| V1.1-在线导入 | ClawHub / GitHub 在线导入 | — | 从 ClawHub 搜索导入 + GitHub URL 导入 |
| V1.1-SSH | 远程 SSH Skill 加载 | — | 连接 OpenClaw 服务器读写 |
| V1.1-主题 | 深色/亮色主题切换 | — | 先产出 light mode demo 验证色值 |
| V1.1-Diff | 配置 Diff | — | 对比编辑前后变更 |
| V1.1-拖拽 | 拖拽排序 | — | sources/topics 列表拖拽重排 |
| V1.1-批量 | 批量操作 | — | 多 Skill 批量导出/验证 |
| V1.1-更新 | Tauri 自动更新 | — | 桌面应用自动更新 |
| V1.1-跨文件校验 | 跨文件联动校验 | #3b | 文件之间的依赖/引用关系校验（如 SKILL.md 中引用的脚本文件是否存在） |
| V1.1-代码联动 | 代码文件桥连/联动增强 | #23 | 为 extra-file 扩展 `usePanelSync` 字段映射逻辑，实现左侧字段 hover 高亮右侧对应代码行（需要为 extra-file 定义实体模型） |
| ~~V1.1-统一解析~~ | ~~统一解析/展示/编辑架构~~ | #24 | ✅ 已在 V1.1-UNIFIED 中完成（SectionBlock 公共组件 + FragmentBlock 统一渲染 + 四分类路由） |
| **V1.1-STYLE-UNIFY** | **跨文件类型展示与编辑一致性** | 用户反馈 | **进行中** — config 文件编辑/预览面板与 SKILL.md 风格统一 + 桥线联动 + 清理废弃代码 + 嵌套 JSON 修复。方案：`.claude/plans/staged-humming-teapot.md` |
| V1.1-标题编辑 | 子区块标题编辑+预览同步 | #15 | 点击编辑时子区块标题进入可编辑状态，修改后右侧源码预览同步更新 |
| V1.1-编辑校验 | SKILL.md 编辑后校验 | #16 | frontmatter 编辑后触发 Zod 校验 + 提示；其他 MD 文件编辑后基础格式校验 |

## V2.0 待办

| ID | 名称 | 来源 | 说明 |
|---|---|---|---|
| V2.0-账户 | 账户系统 + 用户数据存储 | #12 | 需要后端服务（API + DB + Auth）。方案选项：自建 / GitHub OAuth / 第三方Auth。V1.0 以本地产品形式发布，不含账户 |
| V2.0-Onboarding | 新用户引导 + 预设技能 | #13 | 依赖账户系统。提供预设技能模板、引导流程 |

---

## 执行策略（复盘防护）

1. **Demo 先行**（P-1）：涉及新交互的任务编码前先产出 demo
2. **翻译方向**（L1）：从 demo HTML 结构出发写 JSX
3. **验收对照**（P-2/L5/L6）：每个任务完成后对照验收清单逐项打钩
4. **避免多余抽象**（L2）：编辑态 CSS 放 `index.css`
5. **范式分离**（L3）：展示态组件保持 demo 结构，编辑态组件整块替换
6. **委派规则**：核心逻辑 Opus 直接写；重复性组件可委派 fast 子 Agent
7. **数据真实性**（L7）：展示态只显示文件中实际存在的数据，不用代码默认值伪造配置信息。编辑态可展示所有可填字段，但保存时只写入用户实际填写的内容

### 新会话启动指令

每个新会话仅需说：**"开始当前任务"**。

---

## 流程改进

| ID | 名称 | 状态 | 说明 |
|---|---|---|---|
| P-1 | Demo 先行开发流程 | **执行中** | V1.0 路线图已采纳 |
| P-2 | 执行者验收闭环 | **已落地** | session-governor 执行闸门第 4 条"基准对照" |
| P-3 | ✅ Demo 行为规格 | 完成 | `project-harness/evidence/demo-05-behavior-spec.md` |
| P-4 | 有意差异清单 | 维护中 | 当前 4 条 |
| P-5 | ✅ 对齐清单 | 完成 | `project-harness/evidence/demo-05-alignment-checklist.md` |
| P-6 | 多模型交叉 Review | 待讨论 | |
| P-7 | 分批自动串行执行 | 待讨论 | |

---

## 已完成（全部历史）

| ID | 名称 | 完成日期 | task-log |
|---|---|---|---|
| V1.1-TRIGGER-FIX | 触发条件虚假默认值修复 + L7 数据真实性规则 | 2026-04-11 | `evidence/task-logs/2026-04-11-v1.1-trigger-fix.md` |
| V1.1-STYLE-UNIFY | 跨文件类型展示与编辑一致性（Phase A-C） | 2026-04-10 | `evidence/task-logs/2026-04-10-v1.1-style-unify.md` |
| V1.1-SCHEMA-EDIT | schema.json 可编辑 | 2026-04-10 | `evidence/task-logs/2026-04-10-v1.1-schema-edit.md` |
| V1-5 | 代码分割 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-5-code-splitting.md` |
| V1-4 | 保存流程闭环 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-4-save-flow.md` |
| V1-LAYOUT | 布局间距全面优化 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-layout-optimization.md` |
| Phase 1 | 技术选型 + 骨架 + SKILL.md 解析器 + 配置编辑器 MVP | 2026-04-03 | `evidence/task-logs/2026-04-03-phase1.md` |
| Phase 2 | Frontmatter 编辑器、Topics 编辑器、导出、验证器、暗色模式 | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md` |
| Phase 3 | 扩展 8 个 Skill、Schema 查看器、错误边界、README | 2026-04-03 | `evidence/task-logs/2026-04-03-phase2-3.md` |
| Phase 4 | 三栏布局、Tauri 桌面封装、本地 Skill 加载、创建向导 | 2026-04-03 | `evidence/task-logs/2026-04-03-phase4.md` |
| D1 | Demo 交互方案验证（01-05 全系列） | 2026-04-05 | `evidence/task-logs/2026-04-05-demo-optimization.md` |
| T0 | Skill 内容结构调研 | 2026-04-05 | `evidence/task-logs/2026-04-05-skill-structure-research.md` |
| T1 | Frontmatter 结构化编辑器 + i18n | 2026-04-06 | `evidence/task-logs/2026-04-06-t1-frontmatter-form.md` |
| D2 | Demo 方案落地到主应用 | 2026-04-06 | `evidence/task-logs/2026-04-06-d2-bridge-landing.md` |
| D3 | 可视化面板对齐 Demo | 2026-04-06 | `evidence/task-logs/2026-04-06-d3-panel-alignment.md` |
| D2-BUG | 双面板默认等宽修复 | 2026-04-06 | `evidence/task-logs/2026-04-06-d2-panel-width-hotfix.md` |
| D4 | 05-complete 对齐 + 方案 C 面板重写 | 2026-04-06 | `evidence/task-logs/2026-04-06-d4-plan-c-panel-rewrite.md` |
| D5 | Demo 全页面视觉对齐（4 批次） | 2026-04-06 | `evidence/task-logs/2026-04-06-d5-visual-alignment.md` |
| D5-BUG/BUG2 | Inspector 间距 + 字段映射 hotfix | 2026-04-06 | — |
| P-3 | 执行复盘 + Demo 行为规格 | 2026-04-07 | `evidence/task-logs/2026-04-07-retrospective-and-behavior-spec.md` |
| P-5 | 对齐清单产出 | 2026-04-07 | `evidence/demo-05-alignment-checklist.md` |
| Batch 1-5 | Demo 05 对齐修复 | 2026-04-07 | `evidence/task-logs/2026-04-07-al-b*.md` |
| UI-OPT | 前端布局优化 | 2026-04-07 | `evidence/task-logs/2026-04-07-frontend-layout-optimization.md` |
| P2 | 06-inline-edit.html Demo | 2026-04-07 | `evidence/task-logs/2026-04-07-p2-inline-edit-demo.md` |
| F2+F3 | 区块级编辑 + UI 对齐 | 2026-04-07 | `evidence/task-logs/2026-04-07-f2f3-block-editing.md` |
| V1-1 | 文档正文展开 | 2026-04-07 | `evidence/task-logs/2026-04-07-v1-1-doc-expand.md` |
| V1-2 | 技能 CRUD 入口 | 2026-04-07 | `evidence/task-logs/2026-04-07-v1-2-skill-crud.md` |
| V1-3 | 其他文件类型适配 | 2026-04-07 | `evidence/task-logs/2026-04-07-v1-3-extra-files.md` |
| V1-UX | 发布前 UX 优化 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-ux-pre-release.md` |
| V1-UX-FIX | V1-UX 用户反馈修正 | 2026-04-08 | `evidence/task-logs/2026-04-08-v1-ux-fix.md` |
| V1.1-UNIFIED | Markdown 正文统一 + 文件渲染对齐（B1-B5） | 2026-04-09 | `evidence/task-logs/2026-04-09-v1.1-unified.md` |
| V1.1-DATA | 测试数据全量同步 + skill-loader glob + tauri extra files | 2026-04-09 | `evidence/task-logs/2026-04-09-v1.1-data.md` |
| V1.1-SCHEMA-EDIT | schema.json 可编辑（SchemaRawEditor） | 2026-04-10 | `evidence/task-logs/2026-04-10-v1.1-schema-edit.md` |
