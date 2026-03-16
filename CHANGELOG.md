# Changelog

All notable changes to hud-craft will be documented in this file.

## [1.0.0] - 2026-03-16

### Added
- **Bar Style System**: 4 configurable bar styles (block, segment, dot, ascii) via `barStyle` config
- **Emoji Mode System**: 3 emoji modes (full, minimal, none) via `emojiMode` config
- **Configurable Bar Width**: Adjust bar character count (4-20) via `barWidth` config
- **Interactive Configuration**: `/hud-craft:configure` command with bar style previews
- **Setup Command**: `/hud-craft:setup` for cross-platform statusline configuration

### Changed
- Forked from [claude-hud](https://github.com/jarrodwatts/claude-hud) v0.0.7
- All hardcoded bar characters now use configurable presets
- All hardcoded emoji/icons now respect emoji mode setting
- Config path changed to `~/.claude/plugins/hud-craft/config.json`
- Debug prefix changed to `[hud-craft:*]`
