# hud-craft

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0%2B-f9f1e1.svg)](https://bun.sh/)

A fully customizable statusline HUD for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Themes, bar styles, emoji modes, element ordering, custom colors — all from a single `config.json`.

```
[Opus 4 | Max] · my-project git:(main*) · ⏱️ 12m
⚡ ▰▰▰▱▱▱ 52% · 🧠 34%
🔌 context7 · scrapling · 🪝 3 hooks · 📋 2 CLAUDE.md
✏️ Edit ×2 · 📖 Read ×5 · ⚡ Bash ×1
```

## Quick Start

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y hud-craft"
  }
}
```

Restart Claude Code. Done.

> First run downloads the package automatically. Subsequent runs use the npm cache.

### Other Install Methods

<details>
<summary><b>Install script (migration support, auto-config)</b></summary>

```bash
curl -fsSL https://raw.githubusercontent.com/caeroslabs/hud-craft/main/install.sh | bash
```

The installer auto-detects your runtime, configures `settings.json`, creates a default config, and migrates from claude-hud if present. Safe to run multiple times.
</details>

<details>
<summary><b>Global install (faster startup)</b></summary>

```bash
npm install -g hud-craft
```

Then set your statusLine command to just `hud-craft`:
```json
{
  "statusLine": {
    "type": "command",
    "command": "hud-craft"
  }
}
```
</details>

<details>
<summary><b>Manual clone</b></summary>

```bash
git clone --depth 1 https://github.com/caeroslabs/hud-craft.git ~/.claude/plugins/marketplaces/hud-craft
```
Then run `/hud-craft:setup` inside Claude Code.
</details>

### Requirements

| Requirement | Version |
|-------------|---------|
| Claude Code | v1.0.71+ |
| Node.js | 18+ (or Bun 1.0+) |

## Features

- **5 built-in themes** — Default, Powerline, Clean, Hacker, Minimal
- **4 bar styles** — Block `████░░`, Segment `▰▰▰▱▱▱`, Dot `●●●○○○`, ASCII `###---`
- **4 emoji modes** — Full, Minimal, None, Nerd Font
- **Configurable bar width** — 4 to 20 characters
- **2 layouts** — Expanded (multi-line) or Compact (single line)
- **Element ordering** — Rearrange segments in any order
- **Custom colors** — Override context/quota/accent colors via ANSI codes
- **Project-level config** — `.hud-craft.json` per project overrides global config
- **CLI overrides** — `--theme`, `--bar-style`, `--bar-width`, `--emoji-mode`, `--layout`
- **Cost estimation** — Per-session cost based on Claude API pricing
- **Thinking indicator** — Shows when Claude is thinking
- **Interactive setup** — `/hud-craft:configure` walks you through every option

### Display Segments

| Segment | Description |
|---------|-------------|
| **Project** | Model + tier, project name, git branch, dirty status, session duration |
| **Usage** | API usage quota with bar, 5-hour and 7-day limits, reset times |
| **Identity** | Context window usage (percent, tokens, or remaining) |
| **Tools** | Running/completed tools with per-tool emojis |
| **Environment** | MCP server names, hook names, CLAUDE.md count |
| **Agents** | Subagent status and background tasks |
| **Todos** | Todo progress tracking |
| **Cost** | Estimated session cost in USD |

## Themes

Pick a theme with `/hud-craft:configure` or set it directly in config.

### Default

```
[Opus 4 | Max] · my-project git:(main*) · ⏱️ 12m
⚡ ▰▰▰▱▱▱ 52% · 🧠 34%
🔌 context7 · scrapling · 🪝 3 hooks · 📋 2 CLAUDE.md
✏️ Edit ×2 · 📖 Read ×5
```
`barStyle: "segment"` · `barWidth: 6` · `emojiMode: "full"`

### Powerline

```
[Opus 4 | Max] · my-project git:(main*) · ⏱️ 12m
⚡ ▰▰▰▰▰▱▱▱▱▱ 52% · 🧠 34%
🔌 context7 · scrapling · 🪝 3 hooks · 📋 2 CLAUDE.md
✏️ Edit ×2 · 📖 Read ×5
```
`barStyle: "segment"` · `barWidth: 10` · `emojiMode: "full"`

### Clean

```
[Opus 4 | Max] · my-project git:(main*) · 12m
●●●●●○○○○○ 52% · 34%
```
`barStyle: "dot"` · `barWidth: 10` · `emojiMode: "none"`

### Hacker

```
[Opus 4 | Max] ####---- 52% · my-project git:(main*)
────────────────────
Edit ×2 · Read ×5
```
`barStyle: "ascii"` · `barWidth: 8` · `emojiMode: "none"` · `lineLayout: "compact"`

### Minimal

```
[Opus 4 | Max] · my-project git:(main*) · ⏱️ 12m
██████░░░░ 52% · 🧠 34%
🔌 context7 · scrapling · 🪝 3 hooks · 📋 2 CLAUDE.md
◐ Edit ×2 · ✓ Read ×5
```
`barStyle: "block"` · `barWidth: 6` · `emojiMode: "minimal"`

## Bar Styles

```
block:   ██████░░░░ 52%
segment: ▰▰▰▰▰▰▱▱▱▱ 52%
dot:     ●●●●●●○○○○ 52%
ascii:   ######---- 52%
```

## Emoji Modes

| Element | full | minimal | none | nerd |
|---------|------|---------|------|------|
| Running tool | `◐` | `◐` | *(empty)* | `` |
| Completed | `✓` | `✓` | *(empty)* | `` |
| Duration | `⏱️` | `⏱️` | *(empty)* | `` |
| Warning | `⚠` | `⚠` | `!` | `` |
| Dirty | `*` | `*` | `*` | `` |

> **Nerd Font mode** requires a [Nerd Font](https://www.nerdfonts.com/) installed in your terminal.

## Configuration

All settings live in `~/.claude/plugins/hud-craft/config.json`.

Run `/hud-craft:configure` for interactive setup, or edit manually:

```jsonc
{
  // Layout
  "lineLayout": "expanded",       // "compact" | "expanded"
  "showSeparators": false,
  "pathLevels": 1,                 // 1-3

  // Visual style
  "barStyle": "segment",           // "block" | "segment" | "dot" | "ascii"
  "barWidth": 6,                   // 4-20
  "emojiMode": "full",             // "full" | "minimal" | "none" | "nerd"

  // Segment order (rearrange freely)
  "elementOrder": ["project", "usage", "identity", "tools", "environment"],

  // Custom ANSI color overrides
  "colors": {
    "contextLow": "\u001b[32m",    // green (< 70%)
    "contextMid": "\u001b[33m",    // yellow (70-85%)
    "contextHigh": "\u001b[31m",   // red (> 85%)
    "quotaLow": "\u001b[32m",
    "quotaMid": "\u001b[33m",
    "quotaHigh": "\u001b[31m"
  },

  // Git
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false
  },

  // Display toggles
  "display": {
    "showModel": true,
    "showContextBar": true,
    "contextValue": "percent",     // "percent" | "tokens" | "remaining"
    "showUsage": true,
    "usageBarEnabled": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showDuration": true,
    "showConfigCounts": true,
    "showTokenBreakdown": true,
    "showSpeed": false,
    "showCost": false,
    "showThinking": true,
    "autocompactBuffer": "enabled",
    "usageThreshold": 0,
    "sevenDayThreshold": 80,
    "environmentThreshold": 0
  }
}
```

### Project-Level Config

Drop a `.hud-craft.json` in any project root to override global settings for that project:

```json
{
  "barStyle": "ascii",
  "emojiMode": "none",
  "display": { "showCost": true }
}
```

### CLI Overrides

Pass flags in the statusLine command to override config without editing files:

```
--theme default|powerline|clean|hacker|minimal
--bar-style block|segment|dot|ascii
--bar-width 4-20
--emoji-mode full|minimal|none|nerd
--layout compact|expanded
```

### Configuration Reference

#### Layout & Style

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `lineLayout` | `"compact"` \| `"expanded"` | `"expanded"` | Single line or multi-line |
| `barStyle` | `"block"` \| `"segment"` \| `"dot"` \| `"ascii"` | `"segment"` | Progress bar characters |
| `barWidth` | 4–20 | `6` | Bar character count |
| `emojiMode` | `"full"` \| `"minimal"` \| `"none"` \| `"nerd"` | `"full"` | Emoji decoration level |
| `showSeparators` | boolean | `false` | Separator line before activity |
| `pathLevels` | 1–3 | `1` | Directory depth in project path |
| `elementOrder` | array | `["project","usage","identity","tools","environment"]` | Segment render order |

#### Display Toggles

| Key | Default | Shows |
|-----|---------|-------|
| `showModel` | `true` | `[Opus 4 \| Max]` model bracket |
| `showContextBar` | `true` | Visual progress bar for context |
| `contextValue` | `"percent"` | `"percent"`, `"tokens"` (45k/200k), or `"remaining"` (155k left) |
| `showUsage` | `true` | API usage with quota bar |
| `usageBarEnabled` | `true` | Bar vs text-only for usage |
| `showTools` | `true` | Running/completed tool activity |
| `showAgents` | `true` | Subagent status |
| `showTodos` | `true` | Todo progress |
| `showDuration` | `true` | Session timer |
| `showConfigCounts` | `true` | CLAUDE.md, rules, MCPs, hooks |
| `showTokenBreakdown` | `true` | Token details when context >85% |
| `showSpeed` | `false` | Output tokens per second |
| `showCost` | `false` | Estimated session cost |
| `showThinking` | `true` | Thinking indicator (💭) |

#### Advanced Options

| Key | Default | Description |
|-----|---------|-------------|
| `autocompactBuffer` | `"enabled"` | Account for Claude's internal context buffer |
| `usageThreshold` | `0` | Only show usage when % exceeds this (0 = always) |
| `sevenDayThreshold` | `80` | Show 7-day usage when % exceeds this |
| `environmentThreshold` | `0` | Only show environment line above this count |

#### Git Status

| Key | Default | Description |
|-----|---------|-------------|
| `gitStatus.enabled` | `true` | Show git info |
| `gitStatus.showDirty` | `true` | `*` for uncommitted changes |
| `gitStatus.showAheadBehind` | `false` | `↑2 ↓1` ahead/behind counts |
| `gitStatus.showFileStats` | `false` | `+3 ~2 -1` file change stats |

### Context Thresholds

| Usage | Color | Behavior |
|-------|-------|----------|
| < 70% | Green | Normal |
| 70–85% | Yellow | Warning |
| > 85% | Red | Shows token breakdown |

## Troubleshooting

### HUD not showing

1. Restart Claude Code completely
2. Run `bash install.sh --doctor` to diagnose
3. Verify `~/.claude/settings.json` has a `statusLine` entry

### Config changes not applying

Config is read every ~300ms. Changes apply immediately, no restart needed:

1. Verify `config.json` is valid JSON
2. Key names are case-sensitive
3. Run `/hud-craft:configure` to regenerate

### Migrating from claude-hud

```bash
curl -fsSL https://raw.githubusercontent.com/caeroslabs/hud-craft/main/install.sh | bash
```

The installer migrates your config, replaces the statusLine entry, and cleans up old installations.

### Installer flags

```bash
bash install.sh --doctor     # Diagnose issues
bash install.sh --uninstall  # Remove hud-craft
bash install.sh --force      # Skip confirmations
bash install.sh --verbose    # Debug output
```

## Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/caeroslabs/hud-craft/main/install.sh | bash -s -- --uninstall
```

## Development

```bash
npm ci && npm run build    # Install & build
npm test                   # Run tests
npm run dev                # Watch mode
```

### Architecture

```
Claude Code → stdin JSON → parse → render → stdout → Claude Code displays
           └→ transcript JSONL → tools/agents/todos
```

The statusline is invoked every ~300ms. Each invocation reads stdin JSON (model, context, tokens), parses the transcript file for activity, and renders multi-line output.

```
src/
├── index.ts              # Entry point
├── config.ts             # Config types, validation, themes, CLI overrides
├── stdin.ts              # Parse Claude's JSON input
├── transcript.ts         # Parse transcript JSONL
├── config-reader.ts      # Read MCP/rules/hooks configs
├── git.ts                # Git status
├── usage-api.ts          # Usage API (with proxy support)
├── types.ts              # TypeScript interfaces
└── render/
    ├── index.ts           # Render coordinator + element ordering
    ├── colors.ts          # ANSI colors, bar presets, custom colors
    ├── emojis.ts          # Emoji mode system (full/minimal/none/nerd)
    ├── session-line.ts    # Compact mode single line
    ├── tools-line.ts      # Tool activity with per-tool emojis
    ├── agents-line.ts     # Agent status + background tasks
    ├── todos-line.ts      # Todo progress
    ├── cost-line.ts       # Cost estimation
    └── lines/
        ├── project.ts     # Model + project + git + duration
        ├── identity.ts    # Context usage
        ├── usage.ts       # API quota with local timezone
        └── environment.ts # MCP names, hooks, CLAUDE.md counts
```

## Contributing

Issues and PRs welcome at [github.com/caeroslabs/hud-craft](https://github.com/caeroslabs/hud-craft).

## Credits

Based on [claude-hud](https://github.com/jarrodwatts/claude-hud) by [Jarrod Watts](https://github.com/jarrodwatts).

## License

[MIT](LICENSE)
