# SkillForge

**OpenClaw Skill 可视化配置工具** — 从本地文件到远程服务器，用图形界面完成所有 Skill 配置工作。

[![GitHub](https://img.shields.io/github/license/cypsh1/SkillForge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.0-863bff)](https://github.com/cypsh1/SkillForge/releases)

> **SkillForge** is a visual configuration tool for [OpenClaw](https://openclaw.ai) Skills. It replaces manual YAML editing with form-based operations, real-time preview, and cross-file validation. [English version below](#english).

---

## 为什么需要 SkillForge？

| 痛点 | SkillForge 方案 |
|------|----------------|
| YAML 手写易错，缩进敏感 | 表单化编辑器 + 实时类型校验 |
| 多配置文件分散管理 | 统一工作区 + 跨文件关联校验 |
| 改完无法预览，只能部署试错 | 实时预览 + 行级 Diff 对比 |
| SSH + vim 反复切换 | 直连远程服务器，编辑后自动回写 |

## 核心功能

### 可视化编辑
- **表单化编辑器**：下拉选择、开关切换、标签输入，替代手写 YAML
- **实时 Markdown 预览**：编辑即生成 SKILL.md，所见即所得
- **行级 Diff 对比**：保存前一键查看所有变更
- **区域级修改追踪**：精确显示修改了哪些区域、多少处
- **拖拽排序**：sources/topics 列表拖拽调整优先级
- **创建向导**：4 步引导从零创建 Skill

### 连接一切
- **本地文件系统**：自动扫描 `~/.openclaw/workspace/skills/`
- **ClawHub 搜索导入**：搜索社区 Skill 一键下载
- **GitHub URL 导入**：粘贴仓库 URL 自动解析并下载
- **SSH 远程读写**：直连服务器编辑，SFTP 自动回写，支持自动重连

### 质量守护
- **5 条跨文件校验**：引用缺失、空路径、未使用变量等
- **编辑实时拦截**：URL 格式、必填字段校验，错误时阻止保存
- **批量验证**：一键校验全部 Skill，汇总 error/warning/info
- **批量导出**：全部 Skill 序列化为 JSON manifest

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Tauri v2（桌面）+ React 19 + TypeScript 5.9 |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS v4 + shadcn/ui v4 |
| 后端 | Rust（SSH/SFTP：russh + russh-sftp） |
| HTTP | tauri-plugin-http（ClawHub/GitHub API） |
| 国际化 | i18next（中文/英文，~454 key） |

## 快速开始

```bash
# 前端开发（Web 模式，无 SSH 功能）
npm install
npm run dev          # http://localhost:5173

# 桌面应用开发（完整功能，含 SSH）
npm run tauri:dev

# 构建
npm run build        # 前端构建
npm run tauri:build  # 桌面应用构建（.dmg / .msi / .AppImage）
```

## 内置测试数据

仓库附带 19 个来自真实 OpenClaw 实例的完整 Skill（含 config/extra 文件），位于 `src/data/test-skills/`。

## 项目结构

```
SkillForge/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   ├── workspace/      # 工作区（Navigator/Inspector/Editor）
│   │   ├── import-dialog/  # 在线导入（ClawHub/GitHub）
│   │   └── ssh-panel/      # SSH 连接与远程浏览
│   ├── lib/                # 解析/序列化/校验/导入/Diff
│   ├── types/              # 类型定义
│   └── data/               # 测试 Skill 数据
├── src-tauri/              # Rust 后端
│   └── src/
│       ├── lib.rs          # Tauri 插件注册
│       └── ssh.rs          # SSH/SFTP 模块（~280 行）
├── website/                # 官网（Astro）
└── project-harness/        # 项目治理（进度/日志/文档）
```

## 路线图

| 版本 | 状态 | 关键特性 |
|------|------|----------|
| V1.0 | 已完成 | Skill 解析、可视化编辑、实时预览、导出、校验、深色模式 |
| V1.1 | 已完成 | Diff 对比、拖拽排序、跨文件校验、SSH 远程、在线导入、批量操作 |
| V1.2 | 规划中 | 亮色主题、自动更新、配色优化、代码联动增强 |

## 许可证

[MIT](LICENSE)

---

<a name="english"></a>

## English

**SkillForge** is a visual configuration tool for [OpenClaw](https://openclaw.ai) Skills. Built with Tauri v2 + React 19 + Rust, it provides:

- **Visual Editing**: Form-based editor, live Markdown preview, line-level Diff, drag & drop reordering
- **Multi-Source**: Local files, ClawHub search & import, GitHub URL import, SSH remote read/write with auto write-back
- **Quality Guard**: 5 cross-file validation rules, edit-time checks, batch validation & export
- **4-Step Wizard**: Template → Basic Info → Tools → Environment Variables
- **Bilingual**: Chinese & English UI (~454 i18n keys)

### Quick Start

```bash
npm install && npm run dev          # Web dev (no SSH)
npm run tauri:dev                   # Desktop dev (full features)
npm run tauri:build                 # Build desktop app
```

### License

[MIT](LICENSE)
