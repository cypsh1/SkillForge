# Changelog

All notable changes to SkillForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-13

### Added
- Line-level Diff comparison before saving
- Drag & drop reordering for sources and topics lists
- Cross-file validation with 5 rules (missing references, empty paths, unused variables, etc.)
- SSH remote read/write with SFTP auto write-back and auto-reconnect
- ClawHub search and one-click import
- GitHub URL import with directory preview
- Batch validation across all loaded Skills
- Batch export to JSON manifest
- Region-level modification tracking with change indicators
- 4-step creation wizard integration
- Child node deletion support
- Edit-time field validation (URL format, required fields)

### Changed
- Trigger section now shows only real config values instead of phantom defaults
- Unified communication style in harness (code terms + product annotations)

## [1.0.0] - 2026-04-10

### Added
- Skill parsing and visual form-based editing
- Form editor with dropdowns, toggles, tag inputs replacing manual YAML
- Real-time Markdown preview (SKILL.md generation)
- Configuration export and download
- Configuration validation with error/warning reporting
- Dark mode UI
- Bilingual support (Chinese/English, ~454 i18n keys)
- Local file system auto-scan (`~/.openclaw/workspace/skills/`)
- 19 real-world Skill samples included as test data

[1.1.0]: https://github.com/cypsh1/SkillForge/releases/tag/v1.1.0
[1.0.0]: https://github.com/cypsh1/SkillForge/releases/tag/v1.0.0
