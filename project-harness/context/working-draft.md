# Working Draft — 会话中间态存档

## 讨论核心问题

V1.1-在线导入 + V1.1-SSH：代码已全部完成，部分端到端验证待续。

## 已完成

- 4 个 Phase 代码全部写完（HTTP 基础设施 / ClawHub 导入 / GitHub 导入 / SSH Rust+UI）
- tsc ✅ build ✅ cargo build ✅
- ClawHub 搜索已在浏览器中验证通过（真实 API 返回 10 条结果，UI 正确展示）
- 修复了 3 轮 bug（Tauri 环境检测 / 域名错误 / API 路径+类型不匹配 / UI 布局重做）

## 待验证（下次会话第一件事）

1. **GitHub 导入**：在浏览器中粘贴公开 GitHub URL 测试（不需要 tauri dev）
2. **ClawHub 下载**：限流解除后重试下载按钮（浏览器或 tauri dev 均可）
3. **SSH 全流程**：需要 `npx tauri dev` 启动 → 连接 OpenClaw 服务器 → list → read → edit → write-back
4. **ClawHub 下载写入磁盘**：`importSkillBundle()` 依赖 Tauri FS 插件，需要 tauri dev

## 下一步

1. 先在浏览器中测 GitHub 导入（零成本验证）
2. 启动 `npx tauri dev`，依次测 ClawHub 下载 → SSH 连接 → 远程 skill 加载/保存
3. 修复测试中发现的问题
4. 全部验证通过后更新 backlog 标记完成