# 方案 C 面板重写 + 实体规则动态化 执行记录

**日期**: 2026-04-06
**执行模式**: Opus 直接编写（涉及架构决策，未委派子 Agent）

## 调研记录

本次为方案 C 的执行阶段（非新功能开发），调研在上一会话（146b9533）中已完成。

### 策略 A vs B 决策

- **策略 A（选定）**：只动态化 `INSPECTOR_ENTITY_RULES`，`BRIDGE_RELATIONS` 保持 tech-news-digest 静态数据
- **策略 B（不选）**：两者都动态化，自动推断语义关系
- **不选 B 的原因**：虚假的自动推断关系比没有关系更差（误导用户）；动态化 entity rules 已能让所有 Skill 的实体高亮工作；语义关系未来可用 AI 自动标注

## 批次执行

### 步骤 1：CSS 收尾 + data-field 补全（Batch 2 剩余 + Batch 3 合并）

- editor-panel.tsx：section header 字体 `text-sm` → `text-xs`（匹配 Demo `.sl .tt` 12px）
- inspector-panel.tsx：section header 同步修改
- inspector-panel.tsx：新增 `BASIC_FIELD_MAP` + `wrapBasicFieldLines()` 函数，在高亮后的 HTML 上为 name/description/version/homepage 四个 YAML key 包裹 `<span data-field="f-xxx" class="pf">`
- index.css：新增 `.pf` 样式（预览字段级可点击行，hover 背景）
- 注意点：entity 注入系统在 YAML 高亮之后运行，此时 key 已被 `<span class="syntax-key">` 包裹，普通正则匹配不到。因此改用专门的 `wrapBasicFieldLines` 后处理函数，在 HTML 层面匹配 `<span class="syntax-key">name</span>...` 整行包裹

### 步骤 2：实体规则动态化（策略 A）

- inspector-panel.tsx：删除硬编码 `INSPECTOR_ENTITY_RULES` 常量
- inspector-panel.tsx：新增 `buildInspectorEntityRules(skill, fm)` 函数：
  - env：从 `fm.env[]` 动态生成（`\bENV_NAME\b` → eid + fieldKey）
  - tools：从 `skill.tools[]` 动态生成
  - files：从 `fm.files.read/write` 提取目录前缀和 JSON 文件名
  - exec：从 `skill.sections` 中匹配脚本/pipeline 章节标题，提取脚本名
  - basic/meta/doc：空数组
- inspector-panel.tsx：`injectInspectorBridgeEntities` 新增 `allRules` 参数
- inspector-panel.tsx：`SectionedPreview` 新增 `skill` + `fm` props，内部 `useMemo` 计算 entityRules
- editor-panel.tsx：`scriptEidFromSectionTitle` 从硬编码 8 个脚本名 → 通用正则 `/([\w-]+(?:\.py)?)/i` 提取
- 新增 import：`ParsedSkill`, `SkillFrontmatter` 类型

## 子 Agent 使用情况

本次未使用子 Agent。全部改动涉及架构决策（动态规则生成逻辑、basic section 后处理策略），由主对话直接编写。

## 验收确认

- `npx tsc -b --noEmit`: ✅
- `npm run build`: ✅（931KB JS）
- 浏览器验证（tech-news-digest）: ✅ 基本信息字段行 + 环境变量/工具实体高亮
- 浏览器验证（Agent Browser — 无 env/files）: ✅ 空数据 graceful 处理，无崩溃
- Lint: ✅ 无错误

## 改动文件清单

| 文件 | 改动类型 | 说明 |
|---|---|---|
| `src/components/workspace/editor-panel.tsx` | 修改 | section header 字体 + scriptEidFromSectionTitle 动态化 |
| `src/components/workspace/inspector-panel.tsx` | 修改 | wrapBasicFieldLines + buildInspectorEntityRules + SectionedPreview props |
| `src/index.css` | 修改 | 新增 .pf 样式 |
| `project-harness/context/current-state.md` | 更新 | 进度记录 |
| `project-harness/workflow/backlog.md` | 更新 | D4 标记完成 |
