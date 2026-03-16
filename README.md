# hud-craft

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0%2B-f9f1e1.svg)](https://bun.sh/)

A config-driven statusline HUD for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Switch bar styles, emoji modes, and display segments — all from a single `config.json`. Zero config required to start; fully customizable when you're ready.

## What It Looks Like

```
[Opus | Max] | my-project git:(main*)
Context ████░░░░░░ 45% | Usage ██░░░░░░░░ 19% (2h 30m / 5h)
◐ Edit: auth.ts | ✓ Read x3
▸ Fix authentication bug (2/5)
```

### Bar Styles

```
block:   ████░░░░░░ 45%    (default)
segment: ▰▰▰▰▱▱▱▱▱▱ 45%
dot:     ●●●●○○○○○○ 45%
ascii:   ####------ 45%
```

### Emoji Modes

| Element | full | minimal | none |
|---------|------|---------|------|
| Running tool | `◐ Edit: file` | `◐ Edit: file` | `Edit: file` |
| Completed | `✓ Read x3` | `✓ Read x3` | `Read x3` |
| Duration | `⏱️ 5m` | `⏱️ 5m` | `5m` |
| Warning | `⚠ 85%` | `⚠ 85%` | `! 85%` |

## Features

**Core**
- 4 bar styles — Block, Segment, Dot, ASCII
- 3 emoji modes — Full, Minimal, None
- Configurable bar width — 4 to 20 characters
- 2 layouts — Expanded (multi-line) or Compact (single line)

**Display Segments**
- Model + tier display (`[Opus | Max]`)
- Context window progress bar with color thresholds
- API usage tracking with bar or text
- Git branch, dirty status, ahead/behind
- Tool activity (running/completed)
- Subagent status
- Todo progress
- Session duration timer
- Token breakdown at high context (>85%)
- Output speed (tokens/sec)
- Config counts (CLAUDE.md, rules, MCPs, hooks)

**Setup**
- Zero config required — sensible defaults out of the box
- `/hud-craft:configure` — interactive setup walks you through every option
- Universal installer — handles fresh installs, claude-hud migration, updates
- Works with Node.js 18+ or Bun 1.0+

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/caeroslabs/hud-craft/main/install.sh | bash
```

Restart Claude Code. Done.

The installer automatically:
- Detects your runtime (bun or node)
- Configures `settings.json`
- Creates a default `config.json`
- Migrates from claude-hud if present
- Cleans up ghost plugin entries
- Verifies the installation

> Safe to run multiple times. Existing config is preserved on re-runs.

### Other Install Methods

<details>
<summary><b>Manual clone</b></summary>

```bash
git clone --depth 1 https://github.com/caeroslabs/hud-craft.git ~/.claude/plugins/marketplaces/hud-craft
```

Then run `/hud-craft:setup` inside Claude Code.
</details>

<details>
<summary><b>Local install (from cloned repo)</b></summary>

```bash
git clone https://github.com/caeroslabs/hud-craft.git
cd hud-craft
bash install.sh
```
</details>

### Requirements

| Requirement | Version |
|-------------|---------|
| Claude Code | v1.0.71+ |
| Node.js | 18+ (or Bun 1.0+) |
| git | any |
| jq or python3 | for auto-config (optional) |

## Configuration

All settings live in `~/.claude/plugins/hud-craft/config.json`. Edit manually or run `/hud-craft:configure` in Claude Code for interactive setup.

```json
{
  "lineLayout": "expanded",
  "barStyle": "block",
  "barWidth": 10,
  "emojiMode": "minimal",
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false
  },
  "display": {
    "showModel": true,
    "showContextBar": true,
    "showUsage": true,
    "usageBarEnabled": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showDuration": true,
    "showConfigCounts": true,
    "showTokenBreakdown": true,
    "showSpeed": false
  }
}
```

### Layout & Style

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `lineLayout` | `"compact"` \| `"expanded"` | `"expanded"` | Single line or multi-line |
| `barStyle` | `"block"` \| `"segment"` \| `"dot"` \| `"ascii"` | `"block"` | Progress bar characters |
| `barWidth` | 4–20 | `10` | Bar character count |
| `emojiMode` | `"full"` \| `"minimal"` \| `"none"` | `"minimal"` | Emoji decoration level |
| `showSeparators` | boolean | `false` | Separator line before activity |
| `pathLevels` | 1–3 | `1` | Directory depth in project path |

### Display Toggles

| Key | Default | Shows |
|-----|---------|-------|
| `showModel` | `true` | `[Opus \| Max]` model bracket |
| `showContextBar` | `true` | Visual progress bar for context window |
| `contextValue` | `"percent"` | `"percent"` or `"tokens"` for context display |
| `showUsage` | `true` | API usage percentage + time remaining |
| `usageBarEnabled` | `true` | Bar vs text-only for usage |
| `showTools` | `true` | Running/completed tool activity |
| `showAgents` | `true` | Subagent status |
| `showTodos` | `true` | Todo progress |
| `showDuration` | `true` | Session timer |
| `showConfigCounts` | `true` | CLAUDE.md, rules, MCPs, hooks counts |
| `showTokenBreakdown` | `true` | Token details when context >85% |
| `showSpeed` | `false` | Output tokens per second |

### Advanced Options

| Key | Default | Description |
|-----|---------|-------------|
| `display.autocompactBuffer` | `"enabled"` | Account for Claude's internal context buffer in percentage calc |
| `display.usageThreshold` | `0` | Only show usage bar when percentage exceeds this value (0 = always) |
| `display.sevenDayThreshold` | `80` | Warning threshold for 7-day usage percentage |
| `display.environmentThreshold` | `0` | Only show environment line when config count exceeds this |

### Git Status

| Key | Default | Description |
|-----|---------|-------------|
| `gitStatus.enabled` | `true` | Show git info |
| `gitStatus.showDirty` | `true` | `*` indicator for uncommitted changes |
| `gitStatus.showAheadBehind` | `false` | `↑2 ↓1` ahead/behind counts |
| `gitStatus.showFileStats` | `false` | `+3 ~2 -1` file change stats |

### Context Thresholds

The context bar changes color automatically based on usage:

| Usage | Color | Behavior |
|-------|-------|----------|
| < 70% | Green | Normal |
| 70–85% | Yellow | Warning |
| > 85% | Red | Shows token breakdown |

## Output Examples

### Expanded Layout (default)

```
[Opus | Max] | my-project git:(main*)
Context ████░░░░░░ 45% | Usage ██░░░░░░░░ 19% (2h 30m / 5h)
```

### Compact Layout

```
[Opus | Max] ████░░░░░░ 45% | my-project git:(main*) | ██░░░░░░░░ 19% | 5m
```

### With Activity Lines

```
[Opus | Max] | my-project git:(main*)
Context ▰▰▰▰▱▱▱▱▱▱ 45% | Usage ▰▰▱▱▱▱▱▱▱▱ 19%
◐ Edit: auth.ts | ✓ Read x3
▸ Fix authentication bug (2/5)
```

### Minimal (emojiMode: none, compact)

```
[Opus | Max] ####------ 45% | my-project git:(main*) | ##-------- 19% | 5m
```

## Troubleshooting

### HUD not showing after install

1. Restart Claude Code completely
2. Run `bash install.sh --doctor` to diagnose
3. Check that `~/.claude/settings.json` has a `statusLine` entry

### Config changes not applying

Config is read on every statusline refresh (~300ms). Changes apply immediately — no restart needed. If changes don't appear:

1. Verify `~/.claude/plugins/hud-craft/config.json` is valid JSON
2. Check for typos in key names (they're case-sensitive)
3. Run `/hud-craft:configure` to regenerate

### Git status not showing

- `gitStatus.enabled` must be `true` in config
- Must be inside a git repository
- Git must be installed and in PATH

### Migrating from claude-hud

The installer handles this automatically:

```bash
curl -fsSL https://raw.githubusercontent.com/caeroslabs/hud-craft/main/install.sh | bash
```

It will migrate your existing config, replace the statusLine entry, clean up old installations, and remove ghost plugin entries.

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

Or manually:

```bash
# Remove plugin
rm -rf ~/.claude/plugins/marketplaces/hud-craft

# Remove config (optional — preserves your settings)
rm -rf ~/.claude/plugins/hud-craft

# Remove statusLine from settings.json
# Edit ~/.claude/settings.json and delete the "statusLine" key
```

## Development

```bash
npm ci                # Install dependencies
npm run build         # Build TypeScript
npm test              # Run tests
npm run dev           # Watch mode
```

### Testing with stdin

```bash
echo '{"model":{"display_name":"Opus"},"context_window":{"current_usage":{"input_tokens":45000},"context_window_size":200000}}' | node dist/index.js
```

### Architecture

```
Claude Code → stdin JSON → parse → render → stdout → Claude Code displays
           └→ transcript JSONL → tools/agents/todos
```

The statusline is invoked every ~300ms. Each invocation reads stdin JSON, parses the transcript file, and renders multi-line output to stdout.

## Contributing

Issues and PRs welcome at [github.com/caeroslabs/hud-craft](https://github.com/caeroslabs/hud-craft).

## Credits

Based on [claude-hud](https://github.com/jarrodwatts/claude-hud) by [Jarrod Watts](https://github.com/jarrodwatts). Licensed under MIT.

## License

[MIT](LICENSE)
