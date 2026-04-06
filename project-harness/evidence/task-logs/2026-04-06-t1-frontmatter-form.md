# T1 Frontmatter 结构化编辑器 执行记录

**日期**: 2026-04-06
**执行模式**: Opus 总控/审查 + fast 子 Agent 编写代码

## 调研记录

本次无需额外调研。技术方案基于 T0 调研结论 + 前序对话中的方案评估已确定：

- Zod 做数据建模和验证
- react-hook-form 做表单状态管理
- shadcn/ui 手写分组表单 UI
- 豁免原因：已有技术栈内的确定方案实施，无新选型

## 批次执行

### Batch 1：基础设施

- 安装 [zod@4.3.6](mailto:zod@4.3.6), [react-hook-form@7.72.1](mailto:react-hook-form@7.72.1), @hookform/[resolvers@5.2.2](mailto:resolvers@5.2.2)
- 创建 `src/lib/schemas/frontmatter-schema.ts`：完整 Zod schema + metadata 别名 helper + 字段分组常量
- 更新 `src/types/skill.ts`：SkillFrontmatter 从 Zod 推导，零 breaking change
- tsc 通过

### Batch 2：表单组件

- 创建 `src/components/ui/tag-input.tsx`：通用标签输入组件
- 创建 `src/components/skill-editor/frontmatter-form/` 目录，8 个文件：
  - index.tsx: useForm + zodResolver + FormProvider + 变更同步
  - basic-info-section.tsx: 7 个字段
  - trigger-section.tsx: 触发条件 + 高级命令分发（可折叠）
  - runtime-section.tsx: metadata.openclaw 嵌套字段
  - env-vars-section.tsx: useFieldArray 动态数组
  - install-section.tsx: 安装规格动态数组
  - unknown-fields-section.tsx: K-V 兜底编辑器
- tsc + build 通过

### Batch 3：集成

- editor-panel.tsx: SkillMdPanel 从内联表单切换到 FrontmatterForm
- skill-detail.tsx: FrontmatterEditor 替换为 FrontmatterForm
- 删除旧 SkillMdPanel 中的 EnvTable 和冗余导入
- tsc + build 通过

### 运行时修复

- runtime-section.tsx 使用了 FormLabel/FormDescription（属于 shadcn/ui Form 上下文），
但这些字段不通过 RHF FormField 管理，导致 "useFormField should be used within FormField" 错误
- 修复：改为普通 Label + p 标签

### Batch 5：验收

- npm run dev 正常启动
- 浏览器验证：tech-news-digest 的 5 个分组全部正确渲染
- SKILL.md 实时预览正常
- 删除旧 frontmatter-editor.tsx
- npx tsc -b --noEmit 通过
- npm run build 通过

### Batch 4：i18n 中英文支持

- 安装 [i18next@26.0.3](mailto:i18next@26.0.3), [react-i18next@17.0.2](mailto:react-i18next@17.0.2)
- 新建 `src/i18n/index.ts`（初始化，localStorage 持久化语言偏好）
- 新建 `src/i18n/locales/zh.json` + `en.json`（完整翻译键值对）
- 更新 `src/main.tsx`：顶层 `import "./i18n"`
- 更新 6 个表单子组件 + tag-input.tsx + app-header.tsx：
  - 所有 label、placeholder、description 改为 `t()` 调用
  - Header 新增语言切换按钮（中文时显示「EN」，英文时显示「中文」）
- npx tsc -b --noEmit 通过
- npm run build 通过
- 零硬编码中文残留（grep 验证）

## 子 Agent 使用情况


| 任务                | 模型             | 质量  | 备注                                  |
| ----------------- | -------------- | --- | ----------------------------------- |
| 安装依赖              | fast (shell)   | ✅   | 一次通过                                |
| 代码库探索             | fast (explore) | ✅   | 返回全面准确的代码结构摘要                       |
| Zod schema + 类型对齐 | fast           | ✅   | 按规格执行，tsc 一次通过                      |
| 安装 shadcn 组件      | fast (shell)   | ✅   | 一次通过                                |
| 8 个表单组件文件         | fast           | ⚠️  | tsc 通过但运行时有 FormLabel 上下文错误，Opus 修复 |
| 集成到现有页面           | fast           | ✅   | 按规格执行，清理了冗余导入                       |
| i18n 安装依赖         | fast (shell)   | ✅   | 一次通过                                |
| i18n 批量替换（10+ 文件） | fast           | ✅   | 提供完整映射表，tsc+build 一次通过              |


## 验收确认

- `npm run dev`: ✅
- `npm run build`: ✅（chunk size 警告为既有问题）
- `npx tsc -b --noEmit`: ✅
- 浏览器验证: 新表单在三栏布局中正确渲染，5 个分组 + SKILL.md 预览正常