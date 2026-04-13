# V1.1-UI: UI 全面排查与修复

**日期**: 2026-04-13
**触发**: V1.1.0 发布后 UI 质量审计

## 排查范围

全面审计 59 个组件文件的 UI 一致性，涵盖图标尺寸、字体样式、间距布局、颜色变量化、Editor/Inspector 面板对称性。

## 根因

`index.css` 中 `--spacing-1~6` 覆盖了 Tailwind 默认值（压缩至 50%），导致 `size-3` 等 Tailwind 类实际渲染 6px（预期 12px）。文件删除按钮、Cloud 标记等图标几乎不可见。

## 修改文件（12 个）

| 文件 | 改动摘要 |
|---|---|
| `src/index.css` | 新增 3 个 CSS 变量；doc 颜色改靛蓝；标签宽度 50→70px；ecard/fr/tc 间距加大；7 处硬编码色 → 变量；架构条 gap 加大 |
| `src/lib/bridge-sections.ts` | doc color → #6366f1；导出 FALLBACK_SECTION_COLOR + CONFIG_COLOR |
| `src/components/workspace/section-block.tsx` | `▼` → ChevronDown；`🔒` → Lock icon |
| `src/components/workspace/context-bar.tsx` | text-[8px] → text-[9px]；fallback → import |
| `src/components/workspace/navigator-panel.tsx` | 20+ 图标尺寸修正（18→16, 17→14, 3.5→14px, 3→12px） |
| `src/components/workspace/editor-panel.tsx` | 移除 6 处 section 描述；emoji → lucide 图标；链接颜色变量化；底部留白 |
| `src/components/workspace/inspector-panel.tsx` | padding 对称；`▼` → ChevronDown；硬编码色 → 常量 |
| `src/components/layout/app-header.tsx` | Hammer h-4 w-4 → size-[16px] |
| `src/components/workspace/bridge-connector.tsx` | tooltip 颜色 → CSS 变量；fallback → 常量 |
| `src/components/workspace/extra-file-editors.tsx` | 6 处 #64748b → FALLBACK_SECTION_COLOR |
| `src/components/config-editor/sources-editor.tsx` | 本地 CONFIG_COLOR → import |
| `src/components/config-editor/topics-editor.tsx` | 本地 CONFIG_COLOR → import |

## 验证

- `npx tsc -b --noEmit` ✅
- `npm run build` ✅
- 浏览器 preview 截图验证 ✅
